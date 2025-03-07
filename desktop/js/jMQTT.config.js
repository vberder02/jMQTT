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

// Namespace
jmqtt_config = {};


//////////////////////////////////////////////////////////////////////////////
// Functions

// Copy of jmqtt.callPluginAjax() to handle "My plugins" page when jMQTT.functions.js is not included
jmqtt_config.jmqttAjax = function (_params) {
	$.ajax({
		async: _params.async == undefined ? true : _params.async,
		global: false,
		type: "POST",
		url: "plugins/jMQTT/core/ajax/jMQTT.ajax.php",
		data: _params.data,
		dataType: 'json',
		error: function (request, status, error) {
				if (typeof _params.error === 'function')
					_params.error(request, status, error);
				else
					handleAjaxError(request, status, error);
		},
		success: function (data) {
			if (typeof _params.success === 'function')
				_params.success(data);
		}
	});
}

// Toggle spinner icon on button click
jmqtt_config.toggleIco = function (_this) {
	var h = _this.find('i.fas:hidden');
	var v = _this.find('i.fas:visible');
	v.hide();
	h.show();
}

// Helper to set buttons and texts
jmqtt_config.mosquittoStatus = function (_result) {
	if (_result.installed) {
		$('#bt_mosquittoInstall').addClass('disabled');
		$('#bt_mosquittoRepare').removeClass('disabled');
		$('#bt_mosquittoRemove').removeClass('disabled');
		$('#mosquittoService').empty().html(_result.service);
		$('.local-install').show();
		if (_result.service.includes('running'))
			$('#bt_mosquittoStop').removeClass('disabled');
		else
			$('#bt_mosquittoStop').addClass('disabled');
		if (_result.message.includes('jMQTT'))
			$('#bt_mosquittoEdit').show();
		else
			$('#bt_mosquittoEdit').hide();
	} else {
		$('#bt_mosquittoInstall').removeClass('disabled');
		$('#bt_mosquittoRepare').addClass('disabled');
		$('#bt_mosquittoRemove').addClass('disabled');
		$('.local-install').hide();
	}
	$('#mosquittoStatus').empty().html(_result.message);
}

// Send log level to daemon dynamically
jmqtt_config.logSaveWrapper = function () {
	btSave = $('#bt_savePluginLogConfig');
	if (!btSave.hasClass('jmqttLog')) { // Avoid multiple declaration of the event on the button
		btSave.addClass('jmqttLog');
		btSave.on('click', function() {
			var level = $('input.configKey[data-l1key="log::level::jMQTT"]:checked')
			if (level.length == 1) { // Found 1 log::level::jMQTT input checked
				jmqtt_config.jmqttAjax({
					data: {
						action: "sendLoglevel",
						level: level.attr('data-l2key')
					},
					success: function(data) {
						if (data.state == 'ok')
							$.fn.showAlert({message: "{{Le démon est averti, il n'est pas nécessire de le redémarrer.}}", level: 'success'});
					}
				});
			}
		});
	};
}


//////////////////////////////////////////////////////////////////////////////
// Mosquitto service related buttons

// Launch Mosquitto installation and wait for it to end
$('#bt_mosquittoInstall').on('click', function () {
	if (!$(this).hasClass('disabled')) {
		var btn = $(this);
		bootbox.confirm('{{Etes-vous sûr de vouloir installer le service Mosquitto en local ?}}', function (result) {
			if (result) {
				jmqtt_config.toggleIco(btn);
				jmqtt_config.jmqttAjax({
					data: { action: "mosquittoInstall" },
					error: function (request, status, error) {
						jmqtt_config.toggleIco(btn);
						handleAjaxError(request, status, error);
					},
					success: function(data) {
						jmqtt_config.toggleIco(btn);
						if (data.state == 'ok') {
							jmqtt_config.mosquittoStatus(data.result);
							$.fn.showAlert({message: '{{Le service Mosquitto a bien été installé et configuré.}}', level: 'success'});
						} else {
							$.fn.showAlert({message: data.result, level: 'danger'});
						}
					}
				});
			}
		});
	}
});

// Launch Mosquitto reparation and wait for it to end
$('#bt_mosquittoRepare').on('click', function () {
	if (!$(this).hasClass('disabled')) {
		var btn = $(this);
		bootbox.confirm('{{Etes-vous sûr de vouloir réparer le service Mosquitto local ?}}', function (result) {
			if (result) {
				jmqtt_config.toggleIco(btn);
				jmqtt_config.jmqttAjax({
					data: { action: "mosquittoRepare" },
					error: function (request, status, error) {
						jmqtt_config.toggleIco(btn);
						handleAjaxError(request, status, error);
					},
					success: function(data) {
						jmqtt_config.toggleIco(btn);
						if (data.state == 'ok') {
							jmqtt_config.mosquittoStatus(data.result);
							$.fn.showAlert({message: '{{Le service Mosquitto a bien été réparé.}}', level: 'success'});
						} else {
							$.fn.showAlert({message: data.result, level: 'danger'});
						}
					}
				});
			}
		});
	}
});

// Launch Mosquitto uninstall and wait for it to end
$('#bt_mosquittoRemove').on('click', function () {
	if (!$(this).hasClass('disabled')) {
		var btn = $(this);
		bootbox.confirm('{{Etes-vous sûr de vouloir supprimer le service Mosquitto local ?}}', function (result) {
			if (result) {
				jmqtt_config.toggleIco(btn);
				jmqtt_config.jmqttAjax({
					data: { action: "mosquittoRemove" },
					error: function (request, status, error) {
						jmqtt_config.toggleIco(btn);
						handleAjaxError(request, status, error);
					},
					success: function(data) {
						jmqtt_config.toggleIco(btn);
						if (data.state == 'ok') {
							jmqtt_config.mosquittoStatus(data.result);
							$.fn.showAlert({message: '{{Le service Mosquitto a bien été désinstallé du système.}}', level: 'success'});
						} else {
							$.fn.showAlert({message: data.result, level: 'danger'});
						}
					}
				});
			}
		});
	}
});

// Start/restart Mosquitto service
$('#bt_mosquittoReStart').on('click', function () {
	jmqtt_config.jmqttAjax({
		data: { action: "mosquittoReStart" },
		error: function (request, status, error) {
			handleAjaxError(request, status, error);
		},
		success: function(data) {
			if (data.state == 'ok') {
				jmqtt_config.mosquittoStatus(data.result);
				$.fn.showAlert({message: '{{Le service Mosquitto a bien été (re)démarré.}}', level: 'success'});
			} else {
				$.fn.showAlert({message: data.result, level: 'danger'});
			}
		}
	});
});

// Stop Mosquitto service
$('#bt_mosquittoStop').on('click', function () {
	if (!$(this).hasClass('disabled')) {
		jmqtt_config.jmqttAjax({
			data: { action: "mosquittoStop" },
			error: function (request, status, error) {
				handleAjaxError(request, status, error);
			},
			success: function(data) {
				if (data.state == 'ok') {
					jmqtt_config.mosquittoStatus(data.result);
					$.fn.showAlert({message: '{{Le service Mosquitto a bien été arrêté.}}', level: 'success'});
				} else {
					$.fn.showAlert({message: data.result, level: 'danger'});
				}
			}
		});
	}
});

// Modify jMQTT.conf in Mosquitto service system folder
$('#bt_mosquittoEdit').on('click', function () {
	jmqtt_config.jmqttAjax({
		data: { action: "mosquittoConf" },
		error: function (request, status, error) {
			handleAjaxError(request, status, error);
		},
		success: function(result1) {
			if (result1.state == 'ok') {
				bootbox.confirm({
					title: '{{Modifier le fichier jMQTT.conf du service Mosquitto}}',
					message: '<textarea class="bootbox-input bootbox-input-text form-control" type="text" style="height: 50vh;font-family:CamingoCode,monospace; font-size:small!important; line-height:normal;" spellcheck="false" id="mosquittoConf">' + result1.result + '</textarea>',
					callback: function (result2) {
						if (result2) {
							jmqtt_config.jmqttAjax({
								data: { action: "mosquittoEdit", config: $('#mosquittoConf').value() },
								error: function (request, status, error) {
									handleAjaxError(request, status, error);
								},
								success: function(result3) {
									if (result3.state == 'ok') {
										$.fn.showAlert({message: '{{Le fichier jMQTT.conf a bien été modifiée.<br />Redémarrez le service Mosquitto pour le prendre en compte.}}', level: 'success'});
									} else {
										$.fn.showAlert({message: result3.result, level: 'danger'});
									}
								}
							});
						}
					}
				});
			} else {
				$.fn.showAlert({message: result1.result, level: 'danger'});
			}
		}
	});

});


//////////////////////////////////////////////////////////////////////////////
// Docker callback URL override

// On enable/disable jMqtt callback url override
$('#jmqttUrlOverrideEnable').change(function() {
	$oVal = $('#jmqttUrlOverrideValue');
	if ($(this).value() == '1') {
		if ($oVal.attr('valOver') != "")
			$oVal.value($oVal.attr('valOver'));
		$oVal.removeClass('disabled');
	} else {
		$oVal.attr('valOver', $oVal.value());
		$oVal.value($oVal.attr('valStd'));
		$oVal.addClass('disabled');
	}
});

// On jMqtt callback url override apply
$('#bt_jmqttUrlOverride').on('click', function () {
	var $valEn = $('#jmqttUrlOverrideEnable').value()
	jmqtt_config.jmqttAjax({
		data: {
			action: "updateUrlOverride",
			valEn: $valEn,
			valUrl: (($valEn == '1') ? $('#jmqttUrlOverrideValue').value() : $('#jmqttUrlOverrideValue').attr('valOver'))
		},
		success: function(data) {
			if (data.state != 'ok')
				$.fn.showAlert({message: data.result,level: 'danger'});
			else
				$.fn.showAlert({message: '{{Modification effectuée. Relancez le Démon.}}', level: 'success'});
		}
	});
});


//////////////////////////////////////////////////////////////////////////////
// Backups

// Launch jMQTT backup and wait for it to end
$('#bt_backupJMqttStart').on('click', function () {
	var btn = $(this)
	bootbox.confirm("{{Êtes-vous sûr de vouloir lancer une sauvegarde de jMQTT ?}}<br />({{Il ne sera pas possible d'annuler et le Démon sera arrêté le temps de l'opération}})", function(result) {
		if (!result)
			return;
		// $('a.bt_plugin_conf_view_log[data-log=jMQTT]').click();
		jmqtt_config.toggleIco(btn);
		jmqtt_config.jmqttAjax({
			data: {
				action: "backupCreate"
			},
			error: function (request, status, error) {
				handleAjaxError(request, status, error);
				jmqtt_config.toggleIco(btn);
			},
			success: function(data) {
				if (data.state == 'ok') {
					$.fn.showAlert({message: '{{Sauvegarde effectuée.}}', level: 'success'});
				} else {
					$.fn.showAlert({message: data.result, level: 'danger'});
				}
				jmqtt_config.toggleIco(btn);
			}
		});
	});
});

// Remove selected jMQTT backup
$('#bt_backupJMqttRemove').on('click', function () {
	if (!$('#sel_backupJMqtt option:selected').length)
		return;
	bootbox.confirm('{{Êtes-vous sûr de vouloir supprimer}} <b>' + $('#sel_backupJMqtt option:selected').text() + '</b>{{ ?}}', function(result) {
		if (!result)
			return;
		jmqtt_config.jmqttAjax({
			data: {
				action: "backupRemove",
				file: $('#sel_backupJMqtt').value()
			},
			error: function (request, status, error) {
				handleAjaxError(request, status, error);
			},
			success: function(data) {
				if (data.state == 'ok') {
					$.fn.showAlert({message: '{{Sauvegarde supprimée.}}', level: 'success'});
					$('#sel_backupJMqtt option:selected').remove();
				} else {
					$.fn.showAlert({message: data.result, level: 'danger'});
				}
			}
		});
	});
});

// Launch jMQTT restoration and wait for it to end
$('#bt_backupJMqttRestore').on('click', function () {
	if (!$('#sel_backupJMqtt option:selected').length)
		return;
	var btn = $(this)
	bootbox.confirm('{{Êtes-vous sûr de vouloir restaurer}} <b>' + $('#sel_backupJMqtt option:selected').text() + '</b> ?', function(result) {
		if (!result)
			return;
		jmqtt_config.toggleIco(btn);
		jmqtt_config.jmqttAjax({
			data: {
				action: "backupRestore",
				file: $('#sel_backupJMqtt').value()
			},
			error: function (request, status, error) {
				handleAjaxError(request, status, error);
				jmqtt_config.toggleIco(btn);
			},
			success: function(data) {
				if (data.state == 'ok') {
					$.fn.showAlert({message: '{{Sauvegarde restaurée.}}', level: 'success'});
				} else {
					$.fn.showAlert({message: data.result, level: 'danger'});
				}
				jmqtt_config.toggleIco(btn);
			}
		});
	});
});

// Download the selected jMQTT backup
$('#bt_backupJMqttDownload').on('click', function () {
	if (!$('#sel_backupJMqtt option:selected').length)
		return;
	window.open('core/php/downloadFile.php?pathfile=' + $('#sel_backupJMqtt').value(), "_blank", null);
});

// Add a new jMQTT backup file by upload to the list
$('#bt_backupJMqttUpload').fileupload({
	dataType: 'json',
	replaceFileInput: false,
	done: function(e, data) {
		if (data.result.state != 'ok') {
			$.fn.showAlert({message: data.result.result, level: 'danger'});
		} else {
			var oVal = data.result.result.name;
			var oText = data.result.result.name + ' (' + data.result.result.size +')';
			$('#sel_backupJMqtt').append('<option selected value="' + oVal + '">' + oText + '</option>');
			$.fn.showAlert({message: '{{Fichier(s) ajouté(s) avec succès}}', level: 'success'})
		}
		$('#bt_backupJMqttUpload').val(null);
	}
});


$(document).ready(function() {
	// Remove unneeded Save button
	$('#bt_savePluginConfig').remove();

	if (!dStatus) {
		// Set Mosquitto status
		jmqtt_config.mosquittoStatus(mStatus);
	}

	// Wrap Log Save button
	jmqtt_config.logSaveWrapper();

	// Fix tooltips loading // TODO workarround => bug fix to find
	jeedomUtils.initTooltips();
});
