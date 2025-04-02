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

async function getClubImg() {
  try {
    const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/users/clubs/selected`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (data.isSuccess) {
      const clubImgUrl = data.result.url;
      const clubImg = document.querySelector(".club-img");

      if (clubImg && clubImgUrl) {
        clubImg.src = clubImgUrl;
      } else {
        console.error("이미지 가져오기 실패");
      }
    } else {
      console.error(data.message);
    }
  } catch (error) {
    console.error("동아리 프로필 가져오는 중 오류 발생:", error);
  }
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

    if (!items || items.length === 0) {
      console.log("데이터 없음");
      return;
    }

    items.forEach((item, index) => {
      const modalItem = createModalItem(item.url, item.clubName, item.memberClubId);

      modalItem.addEventListener("click", async () => {
        try {
          await selectClub(item.memberClubId);
          closeModal();
          location.reload();
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

function renderComments(comments) {
  const modalContent = document.querySelector(".content1");
  modalContent.innerHTML = "";

  if (!Array.isArray(comments) || comments.length === 0) {
    modalContent.innerHTML = `
      <div class="comment-items"><p class="no-comment">아직 댓글이 없습니다.</p></div>
    `;

    return;
  }

  //댓글
  comments.forEach((comment) => {
    const commentItem = document.createElement("div");
    commentItem.classList.add("comment-items");

    commentItem.innerHTML = `
      <div class="user-info">
        <p>${comment.departmentName} | ${comment.clubName} | ${comment.nickname}</p>
      </div>
      <div class="comment-content">
        <p>${comment.body}</p>
      </div>
    `;
    modalContent.appendChild(commentItem);

    const hr = document.createElement("hr");
    modalContent.appendChild(hr);
  });
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
        renderPosts(data.result);
        addCommentClickListener();
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
        <div class="dotbox"><img src="../../assets/icons/dot-3.png" class="dot-3" data-id="${post.id}"/></div>
      </div>
    `;

    // 게시물 전체 구성
    postElement.innerHTML = `
      ${postTitle}
      ${imageUrl}
      <hr />
      <div class="reactbar">
        <img src="../../assets/icons/empty-heart.svg" class="heart" data-post-id=${post.id} />
        <p class="heartNum">${post.likeNum}</p>
        <img src="../../assets/icons/comment.png" class="comment" data-id=${post.id} />
        <p class="commentNum"></p>
      </div>
      <hr />
      <p class="contentTitle">${post.title}</p>
      <p class="content">${post.content}</p>
      <hr />
    `;

    mainContainer.appendChild(postElement);

    getHeartStatus(post.id);
    getCommentNum(post.id);
  });
  heartClick();
}

function getHeartStatus(postId) {
  let accessToken = getToken();

  fetch(`${API_SERVER_DOMAIN}/api/v1/community/${postId}/likes`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      //console.log(data);
      //console.log(data.result);

      const heartIcon = document.querySelector(`.heart[data-post-id="${postId}"]`);
      if (!heartIcon) return;

      heartIcon.src = data.result
        ? "../../assets/icons/full-heart.svg"
        : "../../assets/icons/empty-heart.svg";
    })
    .catch((error) => {
      console.error("Error fetching JHeart status:", error);
    });
}

function heartClick() {
  document.querySelectorAll(".heart").forEach((heartIcon) => {
    heartIcon.addEventListener("click", async (event) => {
      const heart = event.target;
      const postId = heart.dataset.postId;
      const currentSrc = heart.src;
      //console.log(postId);

      if (currentSrc.includes("empty-heart.svg")) {
        heart.src = "../../assets/icons/full-heart.svg";
        await updateHeart(postId);
      } else {
        heart.src = "../../assets/icons/empty-heart.svg";
        await updateHeart(postId);
      }

      applyLikeNum(postId);
    });
  });
}

async function applyLikeNum(postId) {
  try {
    const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/community/${postId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (data.isSuccess) {
      const heartNumElement = document.querySelector(
        `.heart[data-post-id="${postId}"]`
      ).nextElementSibling;
      if (heartNumElement) {
        heartNumElement.textContent = data.result.likeNum;
      }
    }
  } catch (error) {
    console.error("좋아요 개수 가져오기 실패:", error);
  }
}

async function updateHeart(postId) {
  try {
    const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/community/${postId}/likes`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();

    if (!data.isSuccess) {
      console.error("좋아요 상태 업데이트 실패");
    }
  } catch (error) {
    console.error("좋아요 상태 업데이트 중 오류 발생:", error);
  }
}

function getCommentNum(postId) {
  fetch(`${API_SERVER_DOMAIN}/api/v1/community/${postId}/replies`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      //console.log(data.result);

      const commentCount = data.result.length;
      const commentNumElement = document.querySelector(
        `.comment[data-id="${postId}"] + .commentNum`
      );

      if (commentNumElement) {
        commentNumElement.textContent = commentCount;
      } else {
        console.error(`댓글 수를 표시할 요소를 찾을 수 없음 (postId: ${postId})`);
      }
    })
    .catch((error) => {
      console.error("Error fetching JHeart status:", error);
    });
}

function addCommentClickListener() {
  document.querySelectorAll(".comment").forEach((commentIcon) => {
    commentIcon.addEventListener("click", async () => {
      const commentModal = document.querySelector(".comment-modal");
      const modalContent = document.querySelector(".cm2");
      const articleId = commentIcon.dataset.id;

      modalContent.innerHTML = `
        <div class="content1">
        </div>
        <div class="content2">
          <div class="input-bar">
            <input class="comment-input" type="text" placeholder="댓글 달기.." />
            <img class="send-btn" src="/assets/icons/send-btn.svg" />
          </div>
        </div>
      `;

      const content1 = modalContent.querySelector(".content1");

      //댓글 데이터
      try {
        const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/community/${articleId}/replies`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();

        if (data.isSuccess) {
          renderComments(data.result);
        } else {
          content1.innerHTML = `
            <div class="no-comments">
              <p>댓글을 가져올 수 없습니다. 다시 시도해주세요.</p>
            </div>
          `;
        }
      } catch (error) {
        console.error("댓글 데이터를 가져오는 중 오류 발생:", error);
        content1.innerHTML = "<p>댓글 데이터를 가져오는 중 오류가 발생했습니다.</p>";
      }

      commentModal.style.display = "flex";

      addComment(articleId);
    });
  });
}

function addComment(articleId) {
  const sendBtn = document.querySelector(".send-btn");
  const commentInput = document.querySelector(".comment-input");

  sendBtn.addEventListener("click", async () => {
    const commentContent = commentInput.value.trim();

    if (!commentContent) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/community/${articleId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ body: commentContent }),
      });

      const data = await response.json();

      if (data.isSuccess) {
        alert("댓글이 작성되었습니다.");
        commentInput.value = "";

        getCommentNum(articleId);

        const updatedCommentsResponse = await fetch(
          `${API_SERVER_DOMAIN}/api/v1/community/${articleId}/replies`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const updatedCommentsData = await updatedCommentsResponse.json();

        if (updatedCommentsData.isSuccess) {
          renderComments(updatedCommentsData.result);
        } else {
          console.error("댓글 목록 갱신 실패:", updatedCommentsData.message);
        }
      } else {
        throw new Error(data.message || "댓글 작성 실패");
      }
    } catch (error) {
      console.error("댓글 작성 중 오류 발생:", error);
      alert("댓글 작성 중 오류가 발생했습니다.");
    }
  });
}

function addModalCloseListener() {
  const modal = document.querySelector(".comment-modal");
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      const modalContent = document.querySelector(".cm2");
      modalContent.innerHTML = "";
      modal.style.display = "none";
    }
  });
}

async function deletePost(articleId) {
  const delMessage = confirm("게시글을 삭제하시겠습니까?");
  if (!delMessage) return;

  try {
    const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/community/${articleId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 403) {
      alert("게시글을 삭제할 권한이 없습니다.");
      return;
    }

    const data = await response.json();

    if (data.isSuccess) {
      alert("게시글이 삭제되었습니다.");
      location.reload();
    } else {
      throw new Error(data.message || "게시글 삭제 실패");
    }
  } catch (error) {
    console.error("게시글 삭제 중 오류 발생:", error);
    //alert("게시글 삭제 중 오류가 발생했습니다.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let accessToken = getToken();
  //console.log(accessToken);

  getClubImg();

  const modal = document.querySelector(".club-change-modal");
  const modalClick = document.querySelector(".modal-click2");
  const commentModal = document.querySelector(".comment-modal");

  //modal 열기
  modalClick.addEventListener("click", () => {
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

  commentModal.addEventListener("click", (event) => {
    if (event.target === commentModal) {
      const commentModalContent = document.querySelector(".cm2");
      commentModalContent.innerHTML = "";
      commentModal.style.display = "none";
    }
  });

  getPosts();
});

document.querySelector(".add-post-btn").addEventListener("click", () => {
  window.location.href = "/html/pages/community-upload.html";
});

document.addEventListener("click", async (event) => {
  if (event.target.classList.contains("dot-3")) {
    const articleId = event.target.dataset.id;
    deletePost(articleId);
  }
});
