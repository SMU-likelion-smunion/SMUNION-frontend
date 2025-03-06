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
    console.log("changeModalData", data);

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

function getDepartmentName() {
  fetch(API_SERVER_DOMAIN + `/api/v1/users/clubs/selected`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log("data", data);

      if (data.isSuccess) {
        console.log("getDepartmentName 완료");
        console.log("getDptm", data.result);

        const selectedClub = data.result;

        const departmentName = data.result.departmentName; //departmentName 가져오기
        // const clubName = data.result.clubName; // clubName 가져오기
        // const url = data.result.url; // url 가져오기

        localStorage.setItem("departmentName", departmentName);
        // localStorage.setItem("selectedClub", JSON.stringify({ clubName, url }));

        localStorage.setItem("selectedClub", JSON.stringify(selectedClub));

        // 헤더에 반영
        const headerName = document.querySelector(".header-name");
        const headerImg = document.querySelector(".header-img");
        headerName.textContent = selectedClub.clubName;
        headerImg.src = selectedClub.url;
      } else {
        throw new Error("부서 가져오기 실패");
      }
    })
    .catch((error) => {
      console.error("Error", error);
    });
}

//공지 가져오기
function getClubDetail() {
  return fetch(API_SERVER_DOMAIN + `/api/v1/club/detail`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.isSuccess) {
        //console.log("동아리 전체 공지: ", data.result);
        const {
          basicNoticeDetailResponseList = [],
          attendanceDetailResponseList = [],
          feeNoticeResponseList = [],
          voteResponseList = [],
        } = data.result;

        return [
          ...basicNoticeDetailResponseList,
          ...attendanceDetailResponseList,
          ...feeNoticeResponseList,
          ...voteResponseList,
        ];
      } else {
        throw new Error("failed");
      }
    })
    .catch((error) => console.error("Error club detail:", error));
}

// 특정 동아리 세션에 저장
async function selectClub(memberClubId) {
  let accessToken = getCookie("accessToken");
  console.log("선택한 동아리 ID:", memberClubId);

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
      console.log("동아리 선택 성공:", data);
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

//캘린더 아래 공지 생성
function updateViewNotice(allNotices, selectedDate) {
  const userDepartment = localStorage.getItem("departmentName");
  const viewNotice = document.querySelector(".view-notice");
  viewNotice.innerHTML = ""; // 기존 공지 초기화

  let noticesHTML = "";
  let count = 0;

  allNotices.forEach((notice) => {
    const noticeDate = new Date(notice.date);
    const noticeFormatted = `${noticeDate.getFullYear()}-${String(noticeDate.getMonth() + 1).padStart(2, "0")}-${String(noticeDate.getDate()).padStart(2, "0")}`;

    const targetDepartments = notice.target.split(",").map((target) => target.trim());
    const isTargetMatching =
      targetDepartments.includes("전체") || targetDepartments.includes(userDepartment);

    if (noticeFormatted === selectedDate && isTargetMatching && count < 2) {
      noticesHTML += `
        <div class="view-notice-items" data-id="${notice.noticeId || notice.feeId || notice.attendanceId || notice.voteId}" data-type="${notice.noticeId ? "basic" : notice.feeId ? "fee" : notice.attendanceId ? "attendance" : "vote"}">
          <p>${notice.target}</p>
          <img src="/assets/icons/rectangle1.svg" />
          <p>${notice.title}</p>
          <img src="/assets/icons/Forth.svg" />
        </div>
      `;
      count++;
    }
    viewNotice.innerHTML = noticesHTML;

    document.querySelectorAll(".view-notice-items").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        const type = item.getAttribute("data-type");

        let noticeUrl;
        switch (type) {
          case "basic":
            noticeUrl = `notice-view-default.html?id=${id}`;
            break;
          case "fee":
            noticeUrl = `notice-view-fee.html?id=${id}`;
            break;
          case "attendance":
            noticeUrl = `notice-view-attendance.html?id=${id}`;
            break;
          case "vote":
            noticeUrl = `notice-view-vote.html?id=${id}`;
            break;
          default:
            console.log("failed to create noticeUrl");
            return;
        }

        window.location.href = noticeUrl;
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  let accessToken = getToken();
  console.log(accessToken);

  let allNotices = [];

  const modal = document.querySelector(".club-change-modal");
  const modalClick = document.querySelector(".inner-content");

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

  getDepartmentName(); //departmentName 가져오기

  getClubDetail().then((notices) => {
    allNotices = notices || [];
    //console.log("line 150", allNotices);
    renderCalendar(allNotices);

    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    updateViewNotice(allNotices, todayFormatted);
  });

  const prevScreen = document.querySelector(".prev-screen");

  //캘린더
  //캘린더 헤더 날짜
  //const calHeader = document.querySelector(".cal-top-header h1");
  const prevBtn = document.querySelector("#cal-top-header2 img:nth-of-type(1)");
  const nextBtn = document.querySelector("#cal-top-header2 img:nth-of-type(2)");
  //const calDates = document.querySelector(".cal-dates");

  let currentDate = new Date(); //현재 화면의 날짜
  const today = new Date(); //오늘 날짜

  function renderCalendar(allNotices) {
    //console.log("가져온 allNotices", allNotices);
    const today = new Date();

    const calHeader = document.querySelector(".cal-top-header h1");
    const calDates = document.querySelector(".cal-dates");
    calDates.innerHTML = ""; //날짜 초기화

    //시작 날짜 설정
    let firstDay = new Date(currentDate);
    firstDay.setDate(currentDate.getDate() - currentDate.getDay());

    //캘린더 헤더
    calHeader.textContent = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`; //년 월 일

    const userDepartment = localStorage.getItem("departmentName");

    //날짜 생성
    for (let i = 0; i < 14; i++) {
      let createDate = new Date(firstDay);
      createDate.setDate(firstDay.getDate() + i);

      let spanElement = document.createElement("span");
      spanElement.textContent = createDate.getDate();

      let dateDiv = document.createElement("div");
      dateDiv.classList.add("dates");
      dateDiv.appendChild(spanElement);

      // 공지 추가
      const noticeList = document.createElement("div");
      noticeList.classList.add("todo-list");

      // 공지 데이터 순회
      let count = 0; // 최대 3개까지 공지 표시
      for (let i = 0; i < allNotices.length; i++) {
        const notice = allNotices[i];

        //날짜 & 부서 필터링
        const noticeDate = new Date(notice.date);
        const isSameDate =
          createDate.getFullYear() === noticeDate.getFullYear() &&
          createDate.getMonth() === noticeDate.getMonth() &&
          createDate.getDate() === noticeDate.getDate();

        const targetDepartments = notice.target.split(",").map((target) => target.trim());
        const isTargetMatching =
          targetDepartments.includes("전체") || targetDepartments.includes(userDepartment);

        //필터링 후 공지 추가
        if (isSameDate && isTargetMatching && count < 3) {
          const todoItem = document.createElement("p");
          todoItem.textContent = notice.title;
          noticeList.appendChild(todoItem);
          count++;
        }

        //공지 최대 3개
        if (count >= 3) break;
      }

      if (
        createDate.getFullYear() === today.getFullYear() &&
        createDate.getMonth() === today.getMonth() &&
        createDate.getDate() === today.getDate()
      ) {
        dateDiv.classList.add("selected-date");
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        localStorage.setItem("selectedDate", formattedDate);
      }

      dateDiv.appendChild(noticeList);
      calDates.appendChild(dateDiv);

      //날짜 클릭
      dateDiv.addEventListener("click", () => {
        document.querySelectorAll(".selected-date").forEach((item) => {
          item.classList.remove("selected-date");
          item.querySelectorAll(".todo-list p").forEach((p) => {
            p.style.backgroundColor = "#0E207F";
          });
        });
        dateDiv.classList.add("selected-date");
        calHeader.textContent = `${createDate.getFullYear()}년 ${createDate.getMonth() + 1}월 ${createDate.getDate()}일`;

        const selectedDate = `${createDate.getFullYear()}-${String(createDate.getMonth() + 1).padStart(2, "0")}-${String(createDate.getDate()).padStart(2, "0")}`;
        localStorage.setItem("selectedDate", selectedDate);

        dateDiv.querySelectorAll(".todo-list p").forEach((p) => {
          p.style.backgroundColor = "rgba(256, 256, 256, 0.3)";
        });

        //날짜 클릭 시 캘린더 아래 공지 업데이트
        updateViewNotice(allNotices, selectedDate);
      });

      //기본값으로 오늘 날짜 선택됨
      if (
        createDate.getFullYear() === today.getFullYear() &&
        createDate.getMonth() === today.getMonth() &&
        createDate.getDate() === today.getDate()
      ) {
        dateDiv.classList.add("selected-date");
        dateDiv.querySelectorAll(".todo-list p").forEach((p) => {
          p.style.backgroundColor = "rgba(256, 256, 256, 0.3)";
        });
      }
    }
  }

  //이전 화면으로 이동
  prevScreen.addEventListener("click", () => {
    window.history.back();
  });

  //캘린더 '<' 버튼 클릭
  prevBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 14);
    renderCalendar(allNotices);
  });

  // 캘린더 '>' 버튼 클릭
  nextBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 14);
    renderCalendar(allNotices);
  });

  renderCalendar(allNotices);
  // 페이지 로드 시 오늘 날짜의 공지를 자동으로 표시
  const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayElement = [...document.querySelectorAll(".dates")].find((dateDiv) => {
    return dateDiv.classList.contains("selected-date");
  });

  if (todayElement) {
    localStorage.setItem("selectedDate", todayFormatted);
    todayElement.click(); // 오늘 날짜를 자동으로 클릭하여 공지를 표시
  }

  //'전체보기' 클릭
  document.getElementById("cal-view-all").addEventListener("click", function () {
    window.location.href = "/html/pages/club-full-calendar.html";
  });

  //'전체공지' 클릭
  const allNoticeBox = document.querySelector("#item1");
  if (allNoticeBox) {
    allNoticeBox.addEventListener("click", () => {
      window.location.href = "/html/pages/notice-all.html";
    });
  }

  //'투표' 클릭
  const voteBox = document.querySelector("#item2");
  if (voteBox) {
    voteBox.addEventListener("click", () => {
      window.location.href = "/html/pages/notice-all.html";
    });
  }

  //'회비/정산' 클릭
  const feeCalBox = document.querySelector("#item3");
  if (feeCalBox) {
    feeCalBox.addEventListener("click", () => {
      window.location.href = "/html/pages/notice-all.html";
    });
  }

  //'출석' 클릭
  const attendBox = document.querySelector("#item4");
  if (attendBox) {
    attendBox.addEventListener("click", () => {
      window.location.href = "/html/pages/notice-all.html";
    });
  }

  //'동아리 체계' 클릭
  const clubSystemBox = document.querySelector("#item5");
  if (clubSystemBox) {
    clubSystemBox.addEventListener("click", () => {
      location.href = "clubHierarchy.html";
    });
  }

  //[관리자 권한] 참여 > '생성' 클릭
  const noticeCreate = document.querySelector(".notice-create-btn");
  if (noticeCreate) {
    noticeCreate.addEventListener("click", () => {
      location.href = "club-notice-create.html";
    });
  }

  //[관리자 권한] 갤러리 > '참여' 클릭
  const galleryCreate = document.querySelector(".gallery-create-btn");
  if (galleryCreate) {
    galleryCreate.addEventListener("click", () => {
      location.href = "gallery-create.html";
    });
  }

  //갤러리
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
      console.log("gallery data", data);

      if (data.isSuccess && data.result && data.result.galleryResDTOS) {
        console.log("gallery data 조회 성공");

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
          document.querySelector(".gallery-content").insertAdjacentHTML("beforeend", galleryItem);
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
});
