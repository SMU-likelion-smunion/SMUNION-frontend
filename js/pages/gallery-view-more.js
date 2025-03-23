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

//운영진 여부 확인
async function checkAdminPrivileges() {
  try {
    const response = await fetch(API_SERVER_DOMAIN + `/api/v1/users/clubs/selected`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    //console.log(data);

    const isAdmin = data.result.departmentName === "운영진";

    const createBtn = document.querySelector(".create-btn");
    const editBtn = document.querySelector(".edit-btn");
    createBtn.style.display = isAdmin ? "block" : "none";
    editBtn.style.display = isAdmin ? "block" : "none";

    if (data.isSuccess) {
      return data.result;
    } else {
      throw new Error("동아리 프로필 조회 실패");
    }
  } catch (error) {
    console.error("Error", error);
  }
}

//갤러리 보여주기
function showGallery() {
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
      if (data.isSuccess && data.result && data.result.galleryResDTOS) {
        data.result.galleryResDTOS.reverse().forEach((item) => {
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

  checkAdminPrivileges();

  showGallery();

  const prevBtn = document.querySelector(".prev-screen img");
  const editBtn = document.querySelector(".edit-btn");
  const createBtn = document.querySelector(".create-btn");

  //'이전' 클릭 시
  prevBtn.addEventListener("click", function () {
    window.location.href = "/html/pages/club-main.html";
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
