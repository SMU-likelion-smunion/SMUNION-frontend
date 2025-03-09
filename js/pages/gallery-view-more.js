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

function showGallery() {
  //갤러리 보여주기
  fetch(API_SERVER_DOMAIN + `/api/v1/gallery/getAll`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      //console.log("gallery data", data);

      if (data.isSuccess && data.result && data.result.galleryResDTOS) {
        //console.log("gallery data 조회 성공");

        data.result.galleryResDTOS.forEach((item) => {
          const galleryId = item.galleryID;
          const name = item.name;
          const thumbnail = item.thumbnailImages.length > 0 ? item.thumbnailImages[0] : null;

          const galleryItem = `
						<div class="gallery-items" data-gallery-id="${galleryId}">
							<img src="${thumbnail}" />
							<img src="/assets/icons/rectangle2.svg" />
							<p>${name}</p>
							<img src="/assets/icons/Forth.svg" />
						</div>
					`;
          document
            .querySelector(".gallery-view-content")
            .insertAdjacentHTML("beforeend", galleryItem);
        });

        // 갤러리 클릭 시
        document.querySelectorAll(".gallery-items").forEach((item) => {
          item.addEventListener("click", function () {
            const galleryId = this.dataset.galleryId;
            localStorage.setItem("selectedGalleryId", galleryId);
            window.location.href = `/html/pages/gallery.html?id=${galleryId}`;
          });
        });
      } else {
        throw new Error("갤러리 데이터 조회 실패");
      }
    })
    .catch((error) => {
      console.error("Error fetching gallery data:", error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  let accessToken = getToken();

  //갤러리 목록
  showGallery();

  const prevBtn = document.querySelector(".prev-screen img");
  const editBtn = document.querySelector(".edit-btn");
  const createBtn = document.querySelector(".create-btn");

  //갤러리 보여주기

  //'이전' 클릭 시
  prevBtn.addEventListener("click", function () {
    window.history.back();
  });

  //'생성' 클릭 시
  createBtn.addEventListener("click", function () {
    location.href = "gallery-create.html";
  });

  //'편집' 클릭 시
  editBtn.addEventListener("click", function () {
    window.location.href = "/html/pages/gallery-edit.html";
  });
});
