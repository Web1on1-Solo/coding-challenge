import VideoCall from './video-call'
import { mockMessage } from './mock-message';

describe('greet tests', () => {
  
  test('video call greet', () => {
    expect(VideoCall.videoCallGreet()).toHaveProperty('text');
  });

  test('meeting type', () => {
    expect(VideoCall.meetingType()).toHaveProperty('text');
  });
  
  test('meeting subject', () => {
    expect(VideoCall.meetingSubject(mockMessage)).toHaveProperty('text');
  });

  test('custom meeting subject', () => {
    expect(VideoCall.customMeetingSubject(mockMessage)).toHaveProperty('text');
  });

  test('choose time', () => {
    expect(VideoCall.videoCallGreet()).toHaveProperty('text');
  });

  test('calendar', () => {
    expect(VideoCall.calendar()).toHaveProperty('text');
  });

});
