import VideoCall from './video-call'

describe('video call tests', () => {
  let videoCall = new VideoCall();
  test('check steps', () => {
    expect(videoCall.steps.length).toBeGreaterThan(0);
  });
  test('return module', () => {
    expect(videoCall.module()).toHaveProperty('apply');
  });
});
