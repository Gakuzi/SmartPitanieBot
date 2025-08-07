var Core = typeof Core !== 'undefined' ? Core : {};

Core.Diagnostics = (function() {
  function collectWebhookStatus() {
    try {
      var info = getTelegramWebhookInfo();
      return info && info.ok ? (info.result || {}) : { error: info && info.description };
    } catch (e) {
      return { error: e.message };
    }
  }

  function runQuick() {
    var props = PropertiesService.getScriptProperties();
    var required = ['ROOT_FOLDER_ID', 'TEMPLATE_SHEET_ID', 'USERS_SPREADSHEET_ID', 'TELEGRAM_TOKEN'];
    var missing = [];
    required.forEach(function(key) { if (!props.getProperty(key)) missing.push(key); });
    var webhook = collectWebhookStatus();
    return {
      ok: missing.length === 0 && webhook && webhook.url,
      missingProps: missing,
      webhook: webhook
    };
  }

  function runFull() {
    var base = runFullSystemTest ? runFullSystemTest() : { passed: 0, failed: 0, tests: [], errors: [] };
    var webhook = collectWebhookStatus();
    return {
      ok: base.failed === 0,
      report: base,
      webhook: webhook
    };
  }

  function autoRepair(options) {
    var opts = options || {};
    var result = { actions: [], errors: [], success: false };
    try {
      var props = PropertiesService.getScriptProperties();
      var needInfra = [];
      ['ROOT_FOLDER_ID', 'TEMPLATE_SHEET_ID', 'USERS_SPREADSHEET_ID'].forEach(function(k){ if (!props.getProperty(k)) needInfra.push(k); });
      if (needInfra.length > 0 && typeof setupCompleteInfrastructure === 'function') {
        var infra = setupCompleteInfrastructure();
        result.actions.push('setupCompleteInfrastructure выполнена');
        if (infra && infra.errors && infra.errors.length) { Array.prototype.push.apply(result.errors, infra.errors); }
      } else {
        // точечное восстановление
        if (typeof restoreTableStructure === 'function') {
          var r = restoreTableStructure();
          result.actions.push('restoreTableStructure выполнена');
          if (r && r.errors && r.errors.length) { Array.prototype.push.apply(result.errors, r.errors); }
        }
      }

      // Вебхук: если не установлен — ставим
      try {
        var webhook = collectWebhookStatus();
        if (!webhook || !webhook.url) {
          var url = ScriptApp.getService().getUrl();
          if (url) {
            var setRes = setTelegramWebhook(url);
            result.actions.push('setTelegramWebhook выполнена');
            if (!setRes || !setRes.ok) {
              result.errors.push('Ошибка установки вебхука: ' + (setRes && setRes.description));
            }
          } else {
            result.errors.push('URL веб-приложения не доступен для установки вебхука');
          }
        }
      } catch (e) {
        result.errors.push('Исключение при установке вебхука: ' + e.message);
      }

      result.success = result.errors.length === 0;
    } catch (e) {
      result.errors.push('Критическая ошибка восстановления: ' + e.message);
      result.success = false;
    }
    return result;
  }

  function formatReportForTelegram(full) {
    try {
      var lines = [];
      lines.push('📊 Результаты самодиагностики');
      lines.push('');
      lines.push('✅ Пройдено: ' + (full.report && full.report.passed || 0));
      lines.push('❌ Провалено: ' + (full.report && full.report.failed || 0));
      if (full.webhook && full.webhook.url) {
        lines.push('🔗 Webhook: установлен');
      } else {
        lines.push('🔗 Webhook: не установлен');
      }
      return lines.join('\n');
    } catch (e) {
      return 'Ошибка форматирования отчета: ' + e.message;
    }
  }

  return {
    runQuick: runQuick,
    runFull: runFull,
    autoRepair: autoRepair,
    formatReportForTelegram: formatReportForTelegram
  };
})();

