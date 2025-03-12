const API_SERVER_DOMAIN = "https://smunion.shop";

let accessToken = getCookie("accessToken");
// const uploadedImages = []; //저장된 이미지 배열

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

let imageArray = []; //이미지 url

document.addEventListener("DOMContentLoaded", () => {
  let accessToken = getToken();

  const prevScreen = document.querySelector(".prev-screen");
  prevScreen.addEventListener("click", () => {
    window.history.back();
  });

  const galleryId = localStorage.getItem("selectedGalleryId");
  const galleryNameInput = document.querySelector("#gallery-name");
  const galleryContent = document.querySelector(".gallery-content");

  if (galleryId) {
    fetch(`${API_SERVER_DOMAIN}/api/v1/gallery/${galleryId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        //console.log(data);
        if (data.isSuccess) {
          galleryNameInput.value = data.result.name;

          //이미지 추가
          //const galleryImages = data.result.thumbnailImages;
          // galleryImages.forEach((imageUrl) => {
          //   const imageItemDiv = document.createElement("div");
          //   imageItemDiv.classList.add("image-item");

          //   const imageElement = document.createElement("img");
          //   imageElement.src = imageUrl;

          //   imageItemDiv.appendChild(imageElement);
          //   galleryContent.appendChild(imageItemDiv);
          // });

          //이미지 업로드 div
          const uploadDiv = document.createElement("div");
          uploadDiv.classList.add("gallery-upload");

          const uploadImg = document.createElement("img");
          uploadImg.src = "/assets/images/create-screen.png";

          uploadDiv.appendChild(uploadImg);
          galleryContent.appendChild(uploadDiv);
        }
      })
      .catch((error) => console.error("Error:", error));
  } else {
    console.log("failed");
  }

  //이미지 업로드
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        const uploadItem = document.createElement("div");
        uploadItem.classList.add("upload-item");

        const img = document.createElement("img");
        img.src = e.target.result;

        uploadItem.appendChild(img);

        const galleryUpload = document.querySelector(".gallery-upload");
        galleryContent.insertBefore(uploadItem, galleryUpload);

        imageArray.push(file);
        console.log("추가한 이미지 저장", imageArray);
      };
      reader.readAsDataURL(file);
      fileInput.value = ""; //같은 파일 연속 업로드 가능
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".gallery-upload")) {
      fileInput.click();
    }
  });

  galleryNameInput.focus();

  //'저장' 클릭 시 갤러리 수정
  const saveBtn = document.querySelector(".save-btn");
  saveBtn.addEventListener("click", async () => {
    if (!galleryId) {
      console.log("갤러리 id 없음");
      return;
    }

    const checkMessage = confirm("정말로 저장하시겠습니까?");
    if (!checkMessage) {
      return;
    }

    const formData = new FormData();
    formData.append("name", galleryNameInput.value);

    imageArray.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/gallery/modify/${galleryId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.isSuccess) {
        alert("갤러리 수정이 완료되었습니다!");
        window.location.href = "/html/pages/gallery.html";
      } else {
        alert("갤러리 수정에 실패하였습니다.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("갤러리 수정 중 오류 발생");
    }
  });
});
