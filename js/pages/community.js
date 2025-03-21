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

async function changeModalData() {
  try {
    const response = await fetch(API_SERVER_DOMAIN + `/api/v1/users/clubs`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    //console.log("changeModalData", data);

    if (data.isSuccess) {
      return data.result;
    } else {
      throw new Error("가입된 동아리 목록 조회 실패");
    }
  } catch (error) {
    console.error("Error", error);
    return [];
  }
}

//modal item 생성 함수
function createModalItem(image, clubName, memberClubId) {
  const div = document.createElement("div");
  const modalItem = document.createElement("div");

  modalItem.classList.add("modal-items");
  modalItem.dataset.memberClubId = memberClubId;

  div.addEventListener("click", () => {
    const selectedId = div.dataset.memberClubId;
    selectClub(selectedId);
    closeModal();
    location.reload();
  });

  const img = document.createElement("img");
  img.src = image;

  const p = document.createElement("p");
  p.textContent = clubName;

  modalItem.appendChild(img);
  modalItem.appendChild(p);

  return modalItem;
}

async function addModalItems() {
  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = ""; // 기존 내용 초기화

  try {
    const items = await changeModalData();
    //console.log("받은 데이터", items);

    if (!items || items.length === 0) {
      console.log("데이터 없음");
      return;
    }

    items.forEach((item, index) => {
      const modalItem = createModalItem(item.url, item.clubName, item.memberClubId);

      modalItem.addEventListener("click", async () => {
        try {
          await selectClub(item.memberClubId); // 동아리 선택
          closeModal();
          location.reload(); //새로고침
        } catch (error) {
          console.error("동아리 선택 오류:", error);
        }
      });

      modalContent.appendChild(modalItem);

      if (index < items.length - 1) {
        const hr = document.createElement("hr");
        modalContent.appendChild(hr);
      }
    });
  } catch (error) {
    console.error("모달 데이터 추가 중 오류 발생:", error);
  }
}

// 모달을 띄우는 함수
function openModal() {
  document.querySelector(".club-change-modal").style.display = "block";
  addModalItems();
}

// 모달을 닫는 함수
function closeModal() {
  document.querySelector(".club-change-modal").style.display = "none";
}

async function selectClub(memberClubId) {
  let accessToken = getCookie("accessToken");
  //console.log("선택한 동아리 ID:", memberClubId);

  try {
    const response = await fetch(
      `${API_SERVER_DOMAIN}/api/v1/users/clubs/select?memberClubId=${memberClubId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    if (data.isSuccess) {
      //console.log("동아리 선택 성공:", data);
      const selectedClub = data.result; //선택한 동아리 정보 저장

      // 헤더 업데이트
      const headerName = document.querySelector(".header-name");
      const headerImg = document.querySelector(".header-img");

      headerName.textContent = selectedClub.clubName;
      headerImg.src = selectedClub.url;

      localStorage.setItem("selectedClub", JSON.stringify(selectedClub));
    } else {
      throw new Error("동아리 선택 실패");
    }
  } catch (error) {
    console.error("Error selecting club:", error);
  }
}

function getPosts() {
  fetch(API_SERVER_DOMAIN + `/api/v1/community`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then((data) => {
      if (data.isSuccess && Array.isArray(data.result)) {
        console.log("Fetched Posts:", data.result);
        renderPosts(data.result);
      } else {
        console.error("Invalid response format:", data);
      }
    })
    .catch((error) => {
      console.error("Error fetching gallery data:", error);
    });
}

function renderPosts(posts) {
  const mainContainer = document.querySelector(".community-main");
  mainContainer.innerHTML = ""; // 기존 내용 초기화

  posts.forEach((post) => {
    const postElement = document.createElement("div");
    postElement.classList.add("post");

    // 이미지가 있을 경우 추가
    let imageUrl = "";
    if (post.images.length > 0) {
      imageUrl = `<img class="postImg" src="${post.images[0]}" alt="post image" />`;
    }

    //작성자 정보 공개 범위
    const clubNameTag = post.clubName !== "비공개" ? `<p>${post.clubName}</p>` : "";
    const departmentNameTag =
      post.departmentName !== "비공개" ? `<p>${post.departmentName}</p>` : "";
    const nicknameTag = post.nickname !== "비공개" ? `<p>${post.nickname}</p>` : "";

    //구분선
    const showDivider1 = clubNameTag && departmentNameTag;
    const showDivider2 = (clubNameTag || departmentNameTag) && nicknameTag;

    // 조건부 렌더링 후 제목 영역
    const postTitle = `
      <div class="post-title">
        <img src="../../assets/images/lion-face.png" class="clubImgInTitle" />
        ${clubNameTag}
        ${showDivider1 ? "|" : ""}
        ${departmentNameTag}
        ${showDivider2 ? "|" : ""}
        ${nicknameTag}
        <div class="dotbox"><img src="../../assets/icons/dot-3.png" class="dot-3" /></div>
      </div>
    `;

    // 게시물 전체 구성
    postElement.innerHTML = `
      ${postTitle}
      ${imageUrl}
      <hr />
      <div class="reactbar">
        <img src="../../assets/icons/heart.png" class="heart" />
        <p class="heartNum">${post.likeNum}</p>
        <img src="../../assets/icons/comment.png" class="comment" />
        <p class="commentNum">0</p>
      </div>
      <hr />
      <p class="contentTitle">${post.title}</p>
      <p class="content">${post.content}</p>
      <hr />
    `;

    mainContainer.appendChild(postElement);
  });

  //   postElement.innerHTML = `
  //     <div class="post-title">
  //       <img src="../../assets/images/lion-face.png" class="clubImgInTitle" />
  //       <p>${post.clubName}</p>
  //       |
  //       <p>${post.departmentName}</p>
  //       |
  //       <p>${post.nickname}</p>
  //       <div class="dotbox"><img src="../../assets/icons/dot-3.png" class="dot-3" /></div>
  //     </div>
  //     ${imageUrl}
  //     <hr />
  //     <div class="reactbar">
  //       <img src="../../assets/icons/heart.png" class="heart" />
  //       <p class="heartNum">${post.likeNum}</p>
  //       <img src="../../assets/icons/comment.png" class="comment" />
  //       <p class="commentNum">0</p>
  //     </div>
  //     <hr />
  //     <p class="contentTitle">${post.title}</p>
  //     <p class="content">${post.content}</p>
  //     <hr />
  //   `;

  //   mainContainer.appendChild(postElement);
  // });
}

document.addEventListener("DOMContentLoaded", () => {
  let accessToken = getToken();

  const modal = document.querySelector(".club-change-modal");
  const modalClick = document.querySelector(".modal-click2");

  //modal 열기
  modalClick.addEventListener("click", () => {
    modal.style.display = "block";
    openModal();
  });

  //modal 닫기
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      const modalContent = document.querySelector(".ccm2");
      modalContent.innerHTML = "";
      modal.style.display = "none";
    }
  });

  getPosts();
});

document.querySelector(".add-post-btn").addEventListener("click", () => {
  window.location.href = "/html/pages/community-upload.html";
});
