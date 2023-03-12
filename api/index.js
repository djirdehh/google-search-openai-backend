const express = require("express");
const { Configuration, OpenAIApi } = require("openai");

require("dotenv").config();

const app = express();
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const COMPLETIONS_MODEL = "gpt-3.5-turbo";

const port = process.env.PORT || 5000;

function tryParseJSONObject(jsonString) {
  try {
    var o = JSON.parse(jsonString);

    // Handle non-exception-throwing cases:
    // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
    // but... JSON.parse(null) returns null, and typeof null === "object",
    // so we must check for that, too. Thankfully, null is falsey, so this suffices:
    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {
    return null;
  }

  return null;
}

const initialMessages = (prompt) => [
  {
    role: "system",
    content:
      "You are ChatGPT, a search engine trained by OpenAI that returns results in a certain format.",
  },
  {
    role: "user",
    content: `I want you to answer the prompt in a certain format. You must create and return a single valid JSON object. The resulting JSON object must be in the format: {"link":"string","title":"string", description:"string"}.\n' +
    '\n' +
    'Do not return any other text in your response message. Only return the valid JSON object.\n' +
    '\n' +
    'The results should resemble the results that would come from a search engine.\n' +
    '\n' +
    '"link" must be a valid working link from the internet. "title" should be 5 to 10 words. "description" should be 10 to 15 words.\n' +
    '\n' +
    'Do not repeat any links, titles, or descriptions. Be creative. Input prompt begins: Who is Akon?`,
  },
  {
    role: "assistant",
    content:
      '{"link":"https://en.wikipedia.org/wiki/Akon","title":"Akon Life and Music","description":"Akon is a Senegalese-American singer, rapper, songwriter, and entrepreneur."}',
  },
  {
    role: "user",
    content: `Do not repeat any links, titles, or descriptions. Be creative. Input prompt begins: ${prompt}`,
  },
];

app.post("/api/ask", async (req, res) => {
  const prompt = req.body.prompt;
  const messages = req.body.messages
    ? req.body.messages
    : initialMessages(prompt);

  try {
    if (prompt == null || prompt.trim() === "") {
      throw new Error("Uh oh, no prompt was provided");
    }

    const response = await openai.createChatCompletion({
      model: COMPLETIONS_MODEL,
      messages,
      n: 1,
    });

    const assistantResponse = response.data.choices[0].message.content.trim();

    messages.push({
      role: "assistant",
      content: assistantResponse,
    });

    messages.push({
      role: "user",
      content: `Do not repeat any links, titles, or descriptions. Be creative. Input prompt begins: ${prompt}`,
    });

    const responseJSON = tryParseJSONObject(assistantResponse);

    // return the result
    return res.status(200).json({
      success: true,
      data: responseJSON ? responseJSON : null,
      messages,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      success: false,
      data: null,
      messages: null,
    });
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}!!`));

module.exports = app;
