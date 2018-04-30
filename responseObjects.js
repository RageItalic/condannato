//Basic definitions object.
//Need to create a new object that has modified text that feels more like a response
//than an analysis.
const traitDetails = {
  "Conscientiousness": {
    // higher: 'self disciplined and dutiful',
    // lower: 'more spontaneous and free'
    higher: 'a self disciplined hard worker and I can understand that you put a lot of effort into everything you do',
    lower: 'incredibly free and spontaneous and I love that! Just remember though, that a happy life is a balance of both work and play'
  },
  "Openness": {
    //higher: 'emotionally aware and willing to try new things',
    //lower: 'more straight-forward and care less about the complex, ambiguous and subtle'
    higher: "emotionally aware and open to new experiences. I think it'll bring you a lot of joy if you keep trying different things and stop dwelling on the sadness in your past" ,
    lower: "very straight-forward and care less about complicated matters and issues. I like that you focus on the big picture and dont sweat the small stuff"
  },
  "Agreeableness": {
    // higher: 'good at getting along with others and have an overall optimistic outlook on life',
    // lower: 'more skeptical of the people around you and value your interests over others'
    higher: "a person with an overall optimistic outlook on life. The more you spend time with other people and really get to know them, the happier you'll be",
    lower: 'more skeptical of the people around you and I can understand that your past experiences might be the reason you value your own interests over others. Keep in mind that not everyone is the same'
  },
  "Emotional range": {
    // higher: 'probably going through a tough time currently and are letting it affect your life',
    // lower: 'calm and collected'
    higher: 'probably going through a tough time currently and are upset because of it. Remember that the longer you obsess over the thing that upsets you, the longer you let it affect your life and mental health',
    lower: 'very calm and collected, and thats great! I understand that you might not be perfectly happy in every aspect of your life right now, but the calmer your approach is to your problems, the better off you will be'
  },
  "Extraversion": {
    // higher: 'very energetic and get along well with others',
    // lower: "more independent of the social world around you and don't always rely on other people"
    higher: 'very energetic and get along well with others. Just remember to not lose touch with yourself when you are surrounded by others',
    lower: "more independent of the social world around you and don't always rely on other people. The fact that you are this independent is a great sign! You can handle yourself and you should be proud of that. Although, keep in mind that this doesn't mean you should isolate yourself"
  }
}

//Basic definitions object.
//Need to create a new object that has modified text that feels more like a response
//than an analysis.
const documentToneDetails = {
  "Anger": {
    // higher: "likely to be preceived as angry",
    // lower: "unlikely to be preceived as angry"
    higher: "angry. Sometimes, it's good to let things out. That way, they no longer have control over you.",
    lower: "calm. This is a good sign because it means that you know how to control your emotions."
  },
  "Fear": {
    // higher: "very likely to be preceived as scared",
    // lower: "unlikely to be preceived as scared"
    higher: "scared. In moments like these, talking to a loved one can help.",
    lower: "more than capable of handling the situation that you are facing. Remember that."
  },
  "Joy": {
    // higher: "likely to be preceived as happy",
    // lower: "unlikely to be preceived as happy"
    higher: "happy! Keep it up.",
    lower: "unhappy. Maybe you should talk this out with someone. It'll be good for you to get it off your chest in front of a real person."
  },
  "Sadness": {
    // higher: "very likely to be preceived as sad",
    // lower: "unlikely to be preceived as sad"
    higher: "sad. If you are avoiding the situation, I don't think it will help. Facing the music is the only way you can get through it.",
    lower: "full of joy. Share your joy with the people around you, it'll only make you happier."
  },
  "Disgust": {
    // higher: "more likely to disapprove of something",
    // lower: "more likely to be unaffected and calm around the descisions of others around you"
    higher: "not amused with the things going on in your life. Remember that you control your life. You have the power to stand up for yourself.",
    lower: "like you have your eyes on the prize. Keep it up! Don't let the descisions of others impact your pursuit of goals and happiness."
  }
}

module.exports = {
  traitDetails,
  documentToneDetails
}