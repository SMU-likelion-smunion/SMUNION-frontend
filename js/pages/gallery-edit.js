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
        data.result.galleryResDTOS.reverse().forEach((item) => {
          const galleryId = item.galleryID;
          const name = item.name;
          const thumbnail = item.thumbnailImages.length > 0 ? item.thumbnailImages[0] : null;

          const galleryItem = `
						<div class="gallery-items" data-gallery-id="${galleryId}">
						  <img class="check-svg" src="/assets/icons/unchecked-circle.svg" />
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

        //갤러리 클릭 시
        document.querySelectorAll(".gallery-items").forEach((item) => {
          item.addEventListener("click", function () {
            const checkImg = this.querySelector(".check-svg");
            if (checkImg.src.includes("unchecked-circle.svg")) {
              checkImg.src = "/assets/icons/full-check-circle.svg";
            } else {
              checkImg.src = "/assets/icons/unchecked-circle.svg";
            }
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

function deleteGallery(galleryId) {
  fetch(API_SERVER_DOMAIN + `/api/v1/gallery/${galleryId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("갤러리 삭제 실패");
      }
      return response.json();
    })
    .then((data) => {
      if (data.isSuccess) {
        window.location.href = "/html/pages/gallery-view-more.html";
      } else {
        throw new Error("갤러리 삭제 실패");
      }
    })
    .catch((error) => {
      console.error("Error deleting gallery:", error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  getToken();

  //갤러리 목록
  showGallery();

  const prevBtn = document.querySelector(".prev-screen img");
  const delBtn = document.querySelector(".del-btn");
  const delModal = document.querySelector(".del-modal");
  const removeBtn = document.querySelector(".remove-btn");
  const cancelBtn = document.querySelector(".cancel-btn");

  //'이전' 클릭 시
  prevBtn.addEventListener("click", function () {
    window.history.back();
  });

  // '삭제' 버튼 클릭 시
  delBtn.addEventListener("click", function () {
    const checkedItems = document.querySelectorAll(
      ".gallery-items .check-svg[src='/assets/icons/full-check-circle.svg']"
    );

    if (checkedItems.length > 0) {
      // 모달을 보이게 함
      delModal.style.display = "block";

      // '삭제' 버튼 클릭 시 선택된 항목들을 삭제
      removeBtn.addEventListener("click", function () {
        checkedItems.forEach((item) => {
          const galleryId = item.closest(".gallery-items").dataset.galleryId;
          deleteGallery(galleryId); // 해당 galleryId로 삭제 요청
        });

        delModal.style.display = "none";
        alert("갤러리 삭제 성공");
      });

      // '취소' 버튼 클릭 시 모달 닫기
      cancelBtn.addEventListener("click", function () {
        delModal.style.display = "none"; // 모달 숨기기
      });
    } else {
      alert("삭제할 갤러리를 선택하세요.");
    }
  });
});
