import registerPromiseWorker from 'promise-worker/register'

registerPromiseWorker((message: any) => {
  if (message.type === 'message') {
    return `Worker reply: ${JSON.stringify(message)}`
  }
})