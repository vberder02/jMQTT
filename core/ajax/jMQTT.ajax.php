<?php

/* This file is part of Jeedom.
 *
 * Jeedom is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Jeedom is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Jeedom. If not, see <http://www.gnu.org/licenses/>.
 */

try {
	require_once __DIR__ . '/../../../../core/php/core.inc.php';
	include_file('core', 'authentification', 'php');

	if (!isConnect('admin')) {
		throw new Exception(__('401 - Accès non autorisé', __FILE__));
	}


	ajax::init(array('fileupload'));

	if (init('action') == 'fileupload') {
		if (!isset($_FILES['file'])) {
			throw new Exception(__('Aucun fichier trouvé. Vérifiez le paramètre PHP (post size limit)', __FILE__));
		}
		if (init('dir') == 'template') {
			$uploaddir = realpath(__DIR__ . '/../../' . jMQTT::PATH_TEMPLATES_PERSO);
			$allowed_ext = '.json';
			$max_size = 500*1024; // 500KB
		} elseif (init('dir') == 'backup') {
			$uploaddir = realpath(__DIR__ . '/../../data/backup'); // TODO
			$allowed_ext = '.tgz';
			$max_size = 100*1024*1024; // 100MB
		} else {
			throw new Exception(__('Téléversement invalide', __FILE__));
		}
		if (filesize($_FILES['file']['tmp_name']) > $max_size) {
			throw new Exception(sprintf(__('Le fichier est trop gros (maximum %s)', __FILE__), sizeFormat($max_size)));
		}
		$extension = strtolower(strrchr($_FILES['file']['name'], '.'));
		if ($extension != $allowed_ext)
			throw new Exception(sprintf(__("L'extension de fichier '%s' n'est pas autorisée", __FILE__), $extension));
		if (!file_exists($uploaddir)) {
			mkdir($uploaddir);
		}
		if (!file_exists($uploaddir)) {
			throw new Exception(__('Répertoire de téléversement non trouvé :', __FILE__) . ' ' . $uploaddir);
		}
		$fname = $_FILES['file']['name'];
		if (file_exists($uploaddir . '/' . $fname)) {
			throw new Exception(__('Impossible de téléverser le fichier car il existe déjà, par sécurité il faut supprimer le fichier existant avant de le remplacer.', __FILE__));
		}
		if (!move_uploaded_file($_FILES['file']['tmp_name'], $uploaddir . '/' . $fname)) {
			throw new Exception(__('Impossible de déplacer le fichier temporaire', __FILE__));
		}
		if (!file_exists($uploaddir . '/' . $fname)) {
			throw new Exception(__('Impossible de téléverser le fichier (limite du serveur web ?)', __FILE__));
		}
		// After template file imported
		if (init('dir') == 'template') {
			// Adapt template for the new jsonPath field
			jMQTT::templateSplitJsonPathByFile($fname);
			// Adapt template for the topic in configuration
			jMQTT::moveTopicToConfigurationByFile($fname);
			jMQTT::logger('info', sprintf(__("Template %s correctement téléversée", __FILE__), $fname));
			ajax::success($fname);
		}
		elseif (init('dir') == 'backup') {
			jMQTT::logger('info', sprintf(__("Sauvegarde %s correctement téléversée", __FILE__), $fname));
			ajax::success(array('name' => $_FILES['file']['name'], 'size' => sizeFormat(filesize($uploaddir.'/'.$_FILES['file']['name']))));
		}
	}

	if (init('action') == 'getTemplateList') {
		ajax::success(jMQTT::templateList());
	}

	if (init('action') == 'getTemplateByFile') {
		ajax::success(jMQTT::templateByFile(init('file')));
	}

	if (init('action') == 'deleteTemplateByFile') {
		if (!jMQTT::deleteTemplateByFile(init('file')))
			throw new Exception(__('Impossible de supprimer le fichier', __FILE__));
		ajax::success(true);
	}

	if (init('action') == 'applyTemplate') {
		$eqpt = jMQTT::byId(init('id'));
		if (!is_object($eqpt) || $eqpt->getEqType_name() != jMQTT::class) {
			throw new Exception(sprintf(__("Pas d'équipement jMQTT avec l'id %s", __FILE__), init('id')));
		}
		$template = jMQTT::templateByName(init('name'));
		$eqpt->applyATemplate($template, init('topic'), init('keepCmd'));
		ajax::success();
	}

	if (init('action') == 'createTemplate') {
		$eqpt = jMQTT::byId(init('id'));
		if (!is_object($eqpt) || $eqpt->getEqType_name() != jMQTT::class) {
			throw new Exception(sprintf(__("Pas d'équipement jMQTT avec l'id %s", __FILE__), init('id')));
		}
		$eqpt->createTemplate(init('name'));
		ajax::success();
	}

	// Enable/Disable Real Time mode on this Broker
	if (init('action') == 'changeRealTimeMode') {
		$broker = jMQTT::getBrokerFromId(init('id'));
		$broker->changeRealTimeMode(init('mode'), init('subscribe'), init('exclude'), init('retained'));
		ajax::success();
	}

	// Add a new command on an existing jMQTT equipment
	if (init('action') == 'newCmd') {
		$eqpt = jMQTT::byId(init('id'));
		if (!is_object($eqpt) || $eqpt->getEqType_name() != jMQTT::class) {
			throw new Exception(sprintf(__("Pas d'équipement jMQTT avec l'id %s", __FILE__), init('id')));
		}
		$new_cmd = jMQTTCmd::newCmd($eqpt, init('name'), init('topic'), init('jsonPath'));
		$new_cmd->save();
		ajax::success(array('id' => $new_cmd->getId(), 'human' => $new_cmd->getHumanName()));
	}

	if (init('action') == 'startMqttClient') {
		$broker = jMQTT::getBrokerFromId(init('id'));
		ajax::success($broker->startMqttClient(true));
	}

	if (init('action') == 'sendLoglevel') {
		jMQTT::toDaemon_setLogLevel(init('level'));
		ajax::success();
	}

	if (init('action') == 'updateUrlOverride') {
		config::save('urlOverrideEnable', init('valEn'), 'jMQTT');
		config::save('urlOverrideValue', init('valUrl'), 'jMQTT');
		ajax::success();
	}

	if (init('action') == 'realTimeGet') {
		$broker = jMQTT::getBrokerFromId(init('id'));
		$_file = jeedom::getTmpFolder('jMQTT').'/rt' . $broker->getId() . '.json';
		if (!file_exists($_file))
			ajax::success([]);
		// Read content from file without error handeling!
		$content = file_get_contents($_file);
		// Decode template file content to json (or raise)
		$json = json_decode($content, true);
		// Get filtering data
		$since = init('since', '');
		// Search for compatible eqLogic on this Broker
		$brk_elogics = jMQTT::byBrkId($broker->getId());
		$res = [];
		// Function to filter array on date
		function since_filter($val) { global $since; return $val['date'] > $since; }
		// Filter array and search for matching eqLogic on remainings
		foreach (array_filter($json, 'since_filter') as $msg) {
			$eqNames = '';
			foreach ($brk_elogics as $eqpt) {
				if (mosquitto_topic_matches_sub($eqpt->getTopic(), $msg['topic']))
					$eqNames .= '<br />#'.$eqpt->getHumanName().'#';
			}
			$msg['existing'] = $eqNames;
			$res[] = $msg;
		}
		// Return result
		ajax::success($res);
	}

	if (init('action') == 'realTimeClear') {
		$broker = jMQTT::getBrokerFromId(init('id'));
		$broker->toDaemon_realTimeClear();
		ajax::success();
	}

	if (init('action') == 'mosquittoInstall') {
		jMQTT::mosquittoInstall();
		ajax::success(jMQTT::mosquittoCheck());
	}

	if (init('action') == 'mosquittoRepare') {
		jMQTT::mosquittoRepare();
		ajax::success(jMQTT::mosquittoCheck());
	}

	if (init('action') == 'mosquittoRemove') {
		jMQTT::mosquittoRemove();
		ajax::success(jMQTT::mosquittoCheck());
	}

	if (init('action') == 'mosquittoReStart') {
		shell_exec(system::getCmdSudo() . ' systemctl restart mosquitto');
		ajax::success(jMQTT::mosquittoCheck());
	}

	if (init('action') == 'mosquittoStop') {
		shell_exec(system::getCmdSudo() . ' systemctl stop mosquitto');
		ajax::success(jMQTT::mosquittoCheck());
	}

	if (init('action') == 'mosquittoConf') {
		$cfg = file_get_contents('/etc/mosquitto/conf.d/jMQTT.conf');
		ajax::success($cfg);
	}

	if (init('action') == 'mosquittoEdit') {
		if (init('config') == '')
			throw new Exception(__('Configuration manquante', __FILE__));
		shell_exec(system::getCmdSudo() . ' tee /etc/mosquitto/conf.d/jMQTT.conf > /dev/null <<jmqttEOF' . "\n" . init('config') . 'jmqttEOF');
		ajax::success(jMQTT::mosquittoCheck());
	}

	if (init('action') == 'backupCreate') {
		jMQTT::logger('info', sprintf(__("Sauvegarde de jMQTT lancée...", __FILE__)));
		exec('php ' . __DIR__ . '/../../resources/jMQTT_backup.php --all >> ' . log::getPathToLog('jMQTT') . ' 2>&1');
		jMQTT::logger('info', sprintf(__("Sauvegarde de jMQTT effectuée", __FILE__)));
		ajax::success();
	}

	if (init('action') == 'backupRemove') {
		jMQTT::logger('debug', sprintf(__("backupRemove: %s", __FILE__), init('file')));

		$_backup = init('file');
		if (!isset($_backup) || is_null($_backup) || $_backup == '')
			throw new Exception(__('Merci de fournir le fichier à supprimer', __FILE__));

		$backup_dir = realpath(__DIR__ . '/../../data/backup');
		$backups = ls($backup_dir, '*.tgz', false, array('files', 'quiet', 'datetime_asc'));

		if (in_array($_backup, $backups) && file_exists($backup_dir.'/'.$_backup))
			unlink($backup_dir.'/'.$_backup);
		else
			throw new Exception(__('Impossible de supprimer le fichier', __FILE__));
		ajax::success();
	}

	if (init('action') == 'backupRestore') {
		$_backup = init('file');
		if (!isset($_backup) || is_null($_backup) || $_backup == '')
			throw new Exception(__('Merci de fournir le fichier à supprimer', __FILE__));

		$backup_dir = realpath(__DIR__ . '/../../data/backup');
		$backups = ls($backup_dir, '*.tgz', false, array('files', 'quiet', 'datetime_asc'));

		if (in_array($_backup, $backups) && file_exists($backup_dir.'/'.$_backup))

		jMQTT::logger('info', sprintf(__("Restauration de la sauvegarde '%s' lancée...", __FILE__), $_backup));
		sleep(10);
		// exec('php ' . __DIR__ . '/../../resources/jMQTT_restore.php --all ' . $backup_dir.'/'.$_backup . ' >> ' . log::getPathToLog('jMQTT') . ' 2>&1 &');
		jMQTT::logger('info', sprintf(__("Restauration de la sauvegarde effectuée", __FILE__)));
		ajax::success();
	}

	throw new Exception(__('Aucune méthode Ajax ne correspond à :', __FILE__) . ' ' . init('action'));
	/*     * *********Catch exeption*************** */
} catch (Exception $e) {
	ajax::error(displayException($e), $e->getCode());
}
?>
