import ChipChat from 'chipchat';
import config from 'config';
import VideoCall from './flows/video-call';

class Main {
  static async start() {
    const bot = new ChipChat({ token:  config.get('apiToken')});
    const videoCall = new VideoCall();
    bot.module(videoCall.module());
    bot.start();
  }
}

Main.start();