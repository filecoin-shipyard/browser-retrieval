const messageTypes = {
  uploadFiles: 'UploadFiles',
  downloadFile: 'DownloadFile',
  deleteFile: 'DeleteFile',
  clearLogs: 'ClearLogs',
  query: 'RetrievalQuery',
  queryResponse: 'RetrievalQueryResponse',
  dealProposal: 'RetrievalDealProposal',
  dealResponse: 'RetrievalDealResponse',
  automationStart: 'AutomationCodeStart',
  automationStop: 'AutomationCodeStop',
  openExtensionInBrowser: 'openExtensionInBrowser',
  mikeMessage: 'mikeMessage', // TEMP - WASM INTEG TEST
};

export default messageTypes;
