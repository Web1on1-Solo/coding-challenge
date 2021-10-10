class Greet {
  static videoCallGreet(){
    return {
      text: "Hi, I'm your virtual assitant I will help you schedule a video call appointment in 4 quick steps",
      meta: { step: 'VC_1'}
    };
  }

  static meetingType(){
    return {
      text: '1/4: What would you like to discuss in our video call?',
      actions: [
        { type: 'postback', text: 'Used Car', payload: 'Used_Car' },
        { type: 'postback', text: 'New Car', payload: 'New_Car' },
        { type: 'postback', text: 'Something else', payload: 'Else' },
      ],
      meta: {
        step: "VC_1_1"
      }
    };
  }

  static meetingSubject(message){
    if(message.text == 'Else') return {
      text: 'What would you like to talk about?',
      meta: {
        step: "VC_1_2"
      }
    }
    return {
      text: `Meeting subject: ${message.text}`,
      meta: {
        subject: message.text,
        step: "VC_2"
      }
    }
  }

  static customMeetingSubject(message){
    return {
      text: `Meeting subject: ${message.text}`,
      meta: {
        subject: message.text,
        step: "VC_2"
      }
    };
  }

  static chooseTime(){
    return {
      text: '2/4 Thank you please choose your prefered date and time',
    };
  }

  static calendar(){
    return {
      text: "please pick date and time",
      role: "agent",
      actions: [
          {
              text: "Open Calendar",
              uri: "https://web1on1.chat",
              fallback: "https://web1on1.chat",
              type: "webview",
              size: "full",
              meta: {
                step: "VC_3"
              }
          }
      ]
    };
  }


}

export default Greet;