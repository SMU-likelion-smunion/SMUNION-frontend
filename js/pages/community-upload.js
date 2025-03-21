const API_SERVER_DOMAIN = "https://smunion.shop";

let accessToken = getCookie("accessToken");
let publicScope = 0;

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

document.addEventListener("DOMContentLoaded", function () {
  getToken();

  const scopeOptions = document.querySelectorAll("tbody .text");
  const scopeIcons = document.querySelectorAll("tbody .icon img");

  const titleInput = document.querySelector(".content input:nth-of-type(1)");
  const contentInput = document.querySelector(".content input:nth-of-type(2)");
  const fileInput = document.getElementById("fileInput");
  const selectImg = document.querySelector(".select-img");
  const imagePreview = document.querySelector(".image-preview");
  const deleteImg = document.querySelector(".delete-img");

  //공개범위 초기화
  function initializePublicScope() {
    publicScope = 0;
    scopeOptions[0].classList.add("selected");
    scopeIcons[0].src = "../../assets/icons/checked_circle.png"; // 선택된 상태
    for (let i = 1; i < scopeIcons.length; i++) {
      scopeIcons[i].src = "../../assets/icons/circle.png"; // 선택 안 된 상태
    }
  }

  //작성자 정보 공개범위 선택
  scopeIcons.forEach((option, index) => {
    option.addEventListener("click", () => {
      publicScope = index;
      scopeOptions.forEach((opt, i) => {
        if (i === index) {
          opt.classList.add("selected");
          scopeIcons[i].src = "../../assets/icons/checked_circle.png";
        } else {
          opt.classList.remove("selected");
          scopeIcons[i].src = "../../assets/icons/circle.png";
        }
      });
    });
  });

  initializePublicScope();

  //파일 업로드
  selectImg.addEventListener("click", () => {
    fileInput.click();
  });

  //이미지 미리보기
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.style.backgroundImage = `url(${e.target.result})`;
        imagePreview.style.backgroundSize = "cover";
        imagePreview.style.backgroundPosition = "center";
      };
      reader.readAsDataURL(file);
    }
  });

  //삭제 클릭 시
  deleteImg.addEventListener("click", () => {
    fileInput.value = "";
    imagePreview.style.backgroundImage = "";
    //alert("이미지가 삭제되었습니다.");
  });

  //업로드 클릭 시
  document.querySelector(".upload").addEventListener("click", () => {
    if (!titleInput.value.trim() || !contentInput.value.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    //데이터
    const requestData = {
      title: titleInput.value.trim(),
      content: contentInput.value.trim(),
      publicScope: publicScope,
    };

    const formData = new FormData();

    formData.append(
      "request",
      new Blob([JSON.stringify(requestData)], { type: "application/json" })
    );

    //이미지 있으면 추가
    if (fileInput.files[0]) {
      formData.append("images", fileInput.files[0]);
    }

    fetch(`${API_SERVER_DOMAIN}/api/v1/community`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("게시글 업로드에 실패했습니다.");
        }
        return response.json();
      })
      .then((data) => {
        alert("게시글이 성공적으로 업로드되었습니다.");
        window.location.href = "/html/pages/community.html";
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("게시글 업로드 중 오류가 발생했습니다.");
      });
  });

  //취소 클릭 시
  document.querySelector(".cancel").addEventListener("click", () => {
    window.location.href = "/html/pages/community.html";
  });
});
