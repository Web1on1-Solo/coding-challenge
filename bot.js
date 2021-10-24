const ChipChat = require('chipchat');

const APPOINTMENT_TYPE = {
	SOMETHING_ELSE: "0",
	USED_CAR: "1",
	NEW_CAR: "2",
}

const LOCATIONS = {
	AMSTERDAM: "0",
	ROTTERDAM: "1",
	DEN_HAAG: "2",
}

class VideoAppointmentBot {
    /**
     * Starting the video appointment bot
     */
    static async start() {
        const bot = new ChipChat({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MTc0NGY0NmIxZjg1NTAwMWUxMmRkOTMiLCJvcmdhbml6YXRpb24iOiI2MTcxYzg4YzRjNjYyMjIxZGZhZTMyMWEiLCJzY29wZSI6InZpZXdlciBhbm9ueW1vdXMgZ3Vlc3QgYWdlbnQgYm90IHN1cGVydmlzb3IgYWRtaW4iLCJncmFudF90eXBlIjoiYWNjZXNzX3Rva2VuIiwiaWF0IjoxNjM1MDcyNTA2LCJleHAiOjE2Mzc2NjQ1MDZ9.kkxjOEXVLGHhR9qZdP_ljacb-bYNnRkWROhBQ5j9Ddw' });

        bot.on('message.create.agent.chat', (message, chat) => {
            chat.say({
                text: "Hi, I'm your Virtual Assistant. I will help you schedule a video call appointment in 4 quick steps.",
                meta: {
                    botstep: 1
                }
            });

            VideoAppointmentBot.stepOne(chat)
        });

        bot.start();
    }

    /**
     * First step of planning a video appointment
     * 
     * @param {*} chat, current state of the chat
     */
    static stepOne(chat) {
        chat.ask({
            text: "1/4: What would you like to discuss in our Video Call?",
            actions: [
                {
                    text: "Used car",
                    payload: APPOINTMENT_TYPE.USED_CAR,
                    type: "postback"
                },
                {
                    text: "New car",
                    payload: APPOINTMENT_TYPE.NEW_CAR,
                    type: "postback"
                },
                {
                    text: "Something else?",
                    payload: APPOINTMENT_TYPE.SOMETHING_ELSE,
                    type: "postback"
                }
            ],
            meta: {
                botstep: 1
            }
        }, VideoAppointmentBot.stepOneResponse);
    }

    /**
     * Second step of planning a video appointment
     * 
     * @param {*} chat, current state of the chat
     */
     static stepTwo(chat) {
        chat.ask({
            text: "2/4: Thank you, please choose your preferred location.",
            actions: [
                {
                    text: "Amsterdam",
                    payload: LOCATIONS.AMSTERDAM,
                    type: "postback"
                },
                {
                    text: "Rotterdam",
                    payload: LOCATIONS.ROTTERDAM,
                    type: "postback"
                },
                {
                    text: "Den Haag",
                    payload: LOCATIONS.DEN_HAAG,
                    type: "postback"
                }
            ],
            meta:{
                botstep: 2
            } 
        }, VideoAppointmentBot.stepTwoResponse);
    }

    /**
     * Third step of planning a video appointment
     * 
     * @param {*} chat, current state of the chat
     */
    static stepThree(chat) {
        
    }

    /**
     * Handling response of the first step
     * 
     * @param {*} message, message input from the contact 
     * @param {*} chat, the current chat state
     */
    static stepOneResponse(message, chat) {
        switch (message.text) {
            case APPOINTMENT_TYPE.USED_CAR:
                chat.say("Chosen: Used car");
                VideoAppointmentBot.stepTwo(chat);
                break;
            case APPOINTMENT_TYPE.NEW_CAR:
                chat.say("Chosen: New car");
                VideoAppointmentBot.stepTwo(chat);
                break;
            case APPOINTMENT_TYPE.SOMETHING_ELSE:
                chat.say("Chosen: Something else");
                chat.ask({
                    text: "What would you like to talk about?",
                    meta: {
                        botstep: 1.1
                    }
                }, () => {
                    VideoAppointmentBot.stepTwo(chat);
                });
                break;
            default:
                chat.say("Something went wrong!");
        }
    }

    /**
     * Handling response of the second step
     * 
     * @param {*} message, message input from the contact 
     * @param {*} chat, the current chat state
     */
    static stepTwoResponse(message, chat) {
        switch (message.text) {
            case LOCATIONS.AMSTERDAM:
                chat.say("Chosen: Amsterdam");
                break;
            case LOCATIONS.ROTTERDAM:
                chat.say("Chosen: Rotterdam");
                break;
            case LOCATIONS.DEN_HAAG:
                chat.say("Chosen: Den Haag");
                break;
            default:
                chat.say("Something went wrong!");
        }
    }    
}

// Starting the bot
VideoAppointmentBot.start();
