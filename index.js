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

app.post("/api/ask", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    if (prompt == null) {
      throw new Error("Uh oh, no prompt was provided");
    }

    const response = await openai.createChatCompletion({
      model: COMPLETIONS_MODEL,
      messages: [
        {
          role: "system",
          content: `
            You are ChatGPT, a search engine trained by OpenAI that returns results in a certain format. Given a question, you must create and return only a valid JSON object which enumerates a set of 10 child objects.
            The resulting JSON object must be in the format: [{"link":"string","title":"string", description:"string"}].\n\n
            Do not return any other text in your response message. Only return the valid JSON object.\n\n
            "link" should be a working link from the internet. "title" should be 5 to 10 words. "description" should be 10 to 15 words.\n\n`,
        },
        { role: "user", content: `${prompt}` },
      ],
      max_tokens: 1000,
      temperature: 0,
      top_p: 0,
    });

    // return the result
    return res.status(200).json({
      success: true,
      message: response.data.choices[0].message.content.trim(),
    });
  } catch (error) {
    console.log(error);
    console.log(error.message);
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}!!`));

module.exports = app;
