import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
const chatContainer = document.getElementById("chatContainer");
const prompt = document.getElementById("prompt");
const btn = document.getElementById("btn");
const imageUploader = document.getElementById("imageUploader");
const audioUploader = document.getElementById("audioUploader");

import { GoogleGenerativeAI } from "https://cdn.jsdelivr.net/npm/@google/generative-ai/+esm";
const genAI = new GoogleGenerativeAI("API_KEY");

async function run(prompt_text, image_data = null, audio_data = null) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-8b",
  });
  const contents = [{ text: prompt_text }];
  if (image_data) {
    contents.push({
      inline_data: { data: image_data, mime_type: "image/png" },
    });
  }

  if (audio_data) {
    contents.push({
      inline_data: { data: audio_data, mime_type: "audio/mpeg" },
    });
  }

  try {
    const result = await model.generateContent(contents);
    const response = await result.response;
    const text = response.text();

    addMessage(text, "response-message");
  } catch (error) {
    addMessage("An error occurred: " + error.message, "response-message");
  }
}

function addMessage(text, className) {
  const messageDiv = document.createElement("div");
  messageDiv.className = className;
  messageDiv.innerHTML = marked.parse(text);
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll
}

btn.addEventListener("click", async () => {
  const prompt_text = prompt.value;
  if (!prompt_text) return;

  addMessage(prompt_text, "user-message");
  prompt.value = "";

  let image_data = null;
  let audio_data = null;

  if (imageUploader.files.length > 0) {
    const file = imageUploader.files[0];
    image_data = await toBase64(file);
  }
  if (audioUploader.files.length > 0) {
    const file = audioUploader.files[0];
    audio_data = await toBase64(file);
  }

  run(prompt_text, image_data, audio_data);
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
  });
}
