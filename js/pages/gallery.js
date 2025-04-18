const API_SERVER_DOMAIN = "https://smunion.shop";

let accessToken = getCookie("accessToken");

function getToken() {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "accessToken") {
      return value;
    }
  }
  return null;
}

/* 쿠키 관련 함수들 */
function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + "=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;";
}

document.addEventListener("DOMContentLoaded", () => {
  let accessToken = getToken();

  const prevScreen = document.querySelector(".prev-screen");
  prevScreen.addEventListener("click", () => {
    window.history.back();
  });

  const galleryId = localStorage.getItem("selectedGalleryId");

  if (galleryId) {
    fetch(`${API_SERVER_DOMAIN}/api/v1/gallery/${galleryId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.isSuccess) {
          //갤러리 이름
          const galleryName = data.result.name;
          const galleryNameP = document.querySelector(".gallery-name");
          galleryNameP.textContent = galleryName;

          //이미지 추가
          const galleryImages = data.result.thumbnailImages;
          const galleryContent = document.querySelector(".gallery-content");

          galleryImages.forEach((imageUrl) => {
            const imageItemDiv = document.createElement("div");
            imageItemDiv.classList.add("image-item");

            const imageElement = document.createElement("img");
            imageElement.src = imageUrl;

            imageItemDiv.appendChild(imageElement);
            galleryContent.appendChild(imageItemDiv);
          });
        }
      })
      .catch((error) => console.error("Error:", error));
  } else {
    console.log("failed");
  }

  //'편집' 클릭 시
  const editBtn = document.querySelector(".edit-btn");
  editBtn.addEventListener("click", () => {
    const confirmEditMessage = confirm(
      "편집을 시작하면 기존 이미지가 사라집니다. 진행하시겠습니까?"
    );

    if (confirmEditMessage) {
      window.location.href = "/html/pages/gallery-modify.html";
    }
  });
});
