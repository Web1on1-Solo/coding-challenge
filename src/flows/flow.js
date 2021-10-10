class Flow {
  steps =[];

  updateMeta(conversation, meta = {}) {
    Object.keys(meta).forEach(key=>conversation.set(key, meta[key]))
  }
  
  module() {
    return module.exports = (bot) => {
      this.steps.forEach(step=>{
        bot.on('message', step.filter || {}, (message, conversation) => {
          const response = step.func(message);
          this.updateMeta(conversation, step.meta);
          this.updateMeta(conversation, response.meta);
          conversation.say({...response, delay: step.delay || 0});
        });
      })
    }
  }
}

export default Flow;