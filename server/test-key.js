// REPLACE 'PASTE_KEY_HERE' WITH YOUR ACTUAL KEY
const API_KEY = "AIzaSyAr6PRLiNVew4j77eyYXNfxMseEGsLlTsU"; 

console.log("🔎 Starting Test...");

async function check() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();

    if (data.error) {
      console.log("❌ ERROR:", data.error.message);
    } else {
      console.log("✅ SUCCESS! Here are your valid model names:");
      // Print the exact names you are allowed to use
      data.models.forEach(m => console.log(`"${m.name.replace("models/", "")}"`));
    }
  } catch (error) {
    console.log("❌ NETWORK ERROR:", error);
  }
}

check();