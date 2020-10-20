/**
 * Creates a toast message.
 *
 * @param  {object} Message
 * @param  {string} Message.message Message to display
 * @param  {'error'|'warning'|'success'} Message.type Type of the message
 * @param  {Func} setMessagesJson React hook function if available
 */
export const create = ({ message, type }, setMessagesJson) => {
  const toastMessages = JSON.parse(localStorage.getItem('toast') || '[]');

  toastMessages.push({
    id: Date.now(),
    message,
    type,
  });

  if (setMessagesJson) {
    setMessagesJson(JSON.stringify(toastMessages));
  } else {
    localStorage.setItem('toast', JSON.stringify(toastMessages));
  }
};

/**
 * Dismiss a toast message.
 *
 * @param  {number} id ID of the toast message to dismiss
 * @param  {Func} setMessagesJson React hook function if available
 */
export const dismiss = (id, setMessagesJson) => {
  const toastMessages = JSON.parse(localStorage.getItem('toast') || '[]');

  const excludeId = toastMessages.filter((m) => m.id !== id);

  if (setMessagesJson) {
    setMessagesJson(JSON.stringify(excludeId));
  } else {
    localStorage.setItem('toast', JSON.stringify(excludeId));
  }
};
