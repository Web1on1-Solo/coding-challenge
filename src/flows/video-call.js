import Flow from './flow';
import Greet from '../services/video-call'

class VideoCall extends Flow {
  baseFilter = {
    '@context': /testbot/i,
  };

  step0Filter = {
    ...this.baseFilter,
    text: ['/assign']
  };

  step1Filter = {
    ...this.baseFilter,
    step: 'VC_1'
  };

  step2Filter = {
    ...this.baseFilter,
    step: 'VC_1_1',
    type: 'postback'
  };

  step3Filter = {
    ...this.baseFilter,
    step: 'VC_1_2',
    type: 'chat'
  };

  step4Filter = {
    ...this.baseFilter,
    step: 'VC_2'
  };


  constructor(){
    super();
    this.steps = [
      {func: Greet.videoCallGreet, filter: this.step0Filter},
      {func: Greet.meetingType, filter: this.step1Filter, delay: 1000},
      {func: Greet.meetingSubject, filter: this.step2Filter, delay: 0},
      {func: Greet.customMeetingSubject, filter: this.step3Filter, delay: 0},
      {func: Greet.chooseTime, filter: this.step4Filter, delay: 1000},
      {func: Greet.calendar, filter: this.step4Filter, delay: 2000},
    ]
  }

}

export default VideoCall;
