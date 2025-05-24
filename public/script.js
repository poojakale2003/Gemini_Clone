const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null; 
let isResponseGenerating = false;


const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "ligth_mode");
     
    //apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    //Restore the stored chats
    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
}

loadLocalstorageData();

const createMessageElement= (content, ...classes) =>{
    const div =document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

//show typing effect by displaying words one by one 
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(()=> {
        //aprnd each word to texr element 
        textElement.innerText += (currentWordIndex === 0? '': ' ')+ words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        if(currentWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");         
            localStorage.setItem("savedChats", chatList.innerHTML); //save chats to local storege
            chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
        }
        chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
    }, 75);


}

const API_URL = "http://https://geminiclone-production.up.railway.app//api/generate";

const generateAPIresponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ message: userMessage })
    });

    const data = await response.json();
    const apiResponse = data?.candidates[0]?.content?.parts[0]?.text?.replace(/\*\*(.*?)\*\*/g, '$1');
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};


//show loading animation while waiting for the API response
const showLoadingAnimation = () => {
    const html = `<div class="message-content">
          <img src="images/gemini.svg" alt="Gemini Image" class="avatar">
          <p class="text"></p>
          <div class="loading-indicator">
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
          </div>
        </div>
        <span onClick = "copyMessage(this)" class="icon material-symbols-rounded"> Content_copy </span>`;

        const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
        chatList.appendChild(incomingMessageDiv);

        chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
        generateAPIresponse(incomingMessageDiv);
}


//copy message text to the clipboard
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; //show tick icon
    setTimeout(() => copyIcon.innerText = "content_copy", 1000); //Revert icon after 1 second
}
//handle sending outgoing chat messages
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return; //Exit if there is no message

    isResponseGenerating = true;

    const html = `<div class="message-content">
          <img src="images/user.jpg" alt="User Image" class="avatar">
          <p class="text"></p>
        </div>`;

        const outgoingMessageDiv = createMessageElement(html, "outgoing");
        outgoingMessageDiv.querySelector(".text").innerText = userMessage;
        chatList.appendChild(outgoingMessageDiv);

        typingForm.reset(); //clear input field
        chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
        document.body.classList.add("hide-header"); // Hide the header one the chat starts
        setTimeout(showLoadingAnimation, 500); //show loading animation after a delay
}

// set usermessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    }); 
});

//toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode")
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

//Delete all the chat from ocal storage when button is clicked
deleteChatButton.addEventListener("click", () => {
    if(confirm("Are you sure you wnat to delete all Messages?")){
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
});

//prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit",(e) => {
    e.preventDefault();

    handleOutgoingChat();
});
