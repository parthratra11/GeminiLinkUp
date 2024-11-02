import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import { GoogleGenerativeAI } from "https://cdn.jsdelivr.net/npm/@google/generative-ai/+esm";

const chatContainer = document.getElementById("chatContainer");
const promptInput = document.getElementById("prompt");
const generateBtn = document.getElementById("btn");
const imageUploader = document.getElementById("imageUploader");
// const audioUploader = document.getElementById("audioUploader");
const streamCheck = document.getElementById("stream");

imageUploader.addEventListener("input", () => {
  document
    .querySelector("div[class='image'] i")
    .classList.add("uploadImageAudio");
});
// audioUploader.addEventListener("input", () => {
//   document
//     .querySelector("div[class='audio'] i")
//     .classList.add("uploadImageAudio");
// });

const API_KEY = import.meta.env.VITE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const chat = model.startChat({
  history: [
    {
      role: "user",
      parts: [{ text: "Hello, You will answer to my prompts." }],
    },
    {
      role: "model",
      parts: [{ text: "Great to meet you. What would you like to know?" }],
    },
  ],
  generationConfig: {
    maxOutputTokens: 1000,
  },
});

// SHOULD BE EXPLAINED OR NOT?
const toBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]); // Get only the Base64 part
    reader.onerror = (error) => reject(error);
  });
};

const generateResult = async (prompt) => {
  try {
    const checked = streamCheck.checked;
    // If the user wants to stream the response, the call this
    const result = checked
      ? await chat.sendMessageStream(prompt)
      : await chat.sendMessage(prompt);

    let text = "";
    const element = addMessage("", "response-message");

    if (checked) {
      for await (const chunk of result.stream) {
        text += chunk.text();
        // Add the message to the same element
        addMessage(text, "response-message", element);
      }
    } else {
      text = await result.response.text();
      // Add the message to the exiting element
      addMessage(text, "response-message", element);
    }

    imageUploader.value = "";
    document
      .querySelector("div[class='image'] i")
      .classList.remove("uploadImageAudio");

    // audioUploader.value = "";
    // document
    //   .querySelector("div[class='audio'] i")
    //   .classList.remove("uploadImageAudio");
  } catch (error) {
    addMessage("An error occurred: " + error.message, "response-message");
  }
};

function addMessage(text, className, messageDiv = null) {
  if (messageDiv === null) {
    messageDiv = document.createElement("div");
    chatContainer.appendChild(messageDiv);
  }
  messageDiv.className = className;
  messageDiv.innerHTML = marked.parse(text);
  // Scroll to the bottom of the window
  window.scrollBy({
    top: chatContainer.scrollHeight,
  });
  // Return the same container
  return messageDiv;
}

generateBtn.addEventListener("click", async () => {
  // Cleanse the prompt
  promptInput.value = promptInput.value
    .replaceAll("\t", "")
    .replaceAll("\n", "");
  if (!promptInput.value || promptInput.value.length === 0) return;

  const prompt = [{ text: promptInput.value }];

  addMessage(promptInput.value, "user-message");
  promptInput.value = "";

  if (imageUploader.files.length > 0) {
    const imageData = await toBase64(imageUploader.files[0]);
    prompt.push({
      inline_data: {
        data: imageData,
        mime_type: "image/png",
      },
    });
  }
  // if (audioUploader.files.length > 0) {
  //   const audioData = await toBase64(audioUploader.files[0]);
  //   prompt.push({
  //     inline_data: {
  //       data: audioData,
  //       mime_type: "audio/mpeg",
  //     },
  //   });
  // }
  generateResult(prompt);
});

/**
 * Event listener to submit when pressed enter
 * (optinal)
 */
promptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    // Simulate clicking the button
    generateBtn.click();
  }
});
