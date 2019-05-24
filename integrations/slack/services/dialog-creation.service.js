function dialogCreationService() {

  const createDialog = function(title, callbackId, elements, submitLabel) {
    let dialog = {
      "title": title,
      "callback_id": callbackId,
      "elements": elements,
    };
    if (submitLabel) {
      dialog = Object.assign(dialog, { "submit_label": submitLabel });
    }
    return dialog;
  }

  const createTextElement = function(label, name, options) {
    const el = {
      "label": label,
      "name": name,
      "type": "text"
    };
    return _mapProperties(el, options, {
      "min_length": "minLength",
      "max_length": "maxLength",
      "optional": "optional",
      "hint": "hint",
      "subtype": "subtype",
      "value": "value",
      "placeholder": "placeholder"
    });
  };

  const createTextAreaElement = function(label, name, options) {
    const el = {
      "label": label,
      "name": name,
      "type": "textarea"
    };
    return _mapProperties(el, options, {
      "minLength": "min_length",
      "maxLength": "max_length",
      "optional": "optional",
      "hint": "hint",
      "subtype": "subtype",
      "value": "value",
      "placeholder": "placeholder"
    });
  };

  function _mapProperties(target, src, propsMap) {
    Object.keys(propsMap).forEach((key) => {
      if (src[key] != undefined) {
        target[propsMap[key]] = src[key];
      }
    });
    return target;
  }

  return {
    createDialog: createDialog,
    createTextElement: createTextElement,
    createTextAreaElement: createTextAreaElement
  };
}

const dialogCreationSvc = dialogCreationService();

module.exports = dialogCreationSvc;