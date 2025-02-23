document.addEventListener("DOMContentLoaded", () => {
    const cancelBtn = document.getElementById("cancel-btn");
    const submitBtn = document.getElementById("submit-btn");
    const amountInput = document.getElementById("amount-input");
    const bankNameInput = document.getElementById("bank-name-input");
    const accountNumberInput = document.getElementById("account-number-input");
    const peopleCounterSection = document.getElementById("people-counter-section");
    const decreaseBtn = document.getElementById("decrease-btn");
    const increaseBtn = document.getElementById("increase-btn");
    const peopleCount = document.getElementById("people-count");
    const autoMemberCountOption = document.getElementById("auto-member-count");
    const excludeWriterOption = document.getElementById("exclude-writer");
  
    // 상태
    let currentCount = 1;
    let isAutoMemberCount = false;
    let isExcludeWriter = false;

    localStorage.removeItem("noticeData");
    localStorage.removeItem("voteData");
    localStorage.removeItem("payData");
    localStorage.removeItem("attendData");
    localStorage.removeItem("noticeTitle");
    localStorage.removeItem("noticeDescription");
  
    // 초기 상태 설정
    const initFromLocalStorage = () => {
      // 기존 저장된 값 불러오기 -> 로컬스토리지에서!
      const savedPayData = localStorage.getItem("payData");
      if (savedPayData) {
        const payData = JSON.parse(savedPayData);
        
        amountInput.value = payData.amount || "";
        bankNameInput.value = payData.bankName || "";
        accountNumberInput.value = payData.accountNumber || "";
        currentCount = payData.participantCount || 1;
        peopleCount.textContent = currentCount;
        
        if (payData.isAutoMemberCount) {
          isAutoMemberCount = true;
          autoMemberCountOption.querySelector(".pay-option-circle").classList.add("selected");
          peopleCounterSection.classList.add("hidden");
        }
        
        if (payData.isExcludeWriter) {
          isExcludeWriter = true;
          excludeWriterOption.querySelector(".pay-option-circle").classList.add("selected");
        }
      }
    };
  
    // 인원수 증가
    const increaseCount = () => {
      currentCount++;
      peopleCount.textContent = currentCount;
    };
  
    // 인원수 감소
    const decreaseCount = () => {
      if (currentCount > 1) {
        currentCount--;
        peopleCount.textContent = currentCount;
      }
    };
  
    // 데이터 가져오기]
    const getPayData = () => {
      const amount = amountInput.value.trim();
      const bankName = bankNameInput.value.trim();
      const accountNumber = accountNumberInput.value.trim();
  
      // 유효성 검사
      if (!amount) {
        alert("금액을 입력해주세요.");
        amountInput.focus();
        return null;
      }
  
      if (!bankName) {
        alert("은행명을 입력해주세요.");
        bankNameInput.focus();
        return null;
      }
  
      if (!accountNumber) {
        alert("계좌번호를 입력해주세요.");
        accountNumberInput.focus();
        return null;
      }
  
      
      return {
        amount: parseInt(amount),
        bankName,
        accountNumber,
        participantCount: currentCount,
        isAutoMemberCount,
        isExcludeWriter
      };
    };
  
   
    // 인원수 조절 버튼
    decreaseBtn.addEventListener("click", decreaseCount);
    increaseBtn.addEventListener("click", increaseCount);
  
    // 옵션
    autoMemberCountOption.addEventListener("click", () => {
      const circle = autoMemberCountOption.querySelector(".pay-option-circle");
      circle.classList.toggle("selected");
      isAutoMemberCount = circle.classList.contains("selected");
  
      // 전달 대상에 맞게~ 어쩌구 클릭하면 인원수 숨김
      if (isAutoMemberCount) {
        peopleCounterSection.classList.add("hidden");
      } else {
        peopleCounterSection.classList.remove("hidden");
      }
    });
  
    excludeWriterOption.addEventListener("click", () => {
      const circle = excludeWriterOption.querySelector(".pay-option-circle");
      circle.classList.toggle("selected");
      isExcludeWriter = circle.classList.contains("selected");
    });
  
    // 취소 버튼
    cancelBtn.addEventListener("click", () => {
      window.history.back();
    });
  
    // 저장 버튼 -> 로컬스토리지에 저장해서 상위페이지에 전달
    submitBtn.addEventListener("click", () => {
      const payData = getPayData();
      if (payData) {
        // 로컬 스토리지에 데이터 저장
        localStorage.setItem("payData", JSON.stringify(payData));
        
        // 공지 데이터 구성
        const noticeData = {
          type: "pay",
          title: localStorage.getItem("noticeTitle") || "",
          description: localStorage.getItem("noticeDescription") || "",
          targetDepartments: localStorage.getItem("targetDepartments") 
            ? JSON.parse(localStorage.getItem("targetDepartments")) 
            : ["전체"],
          payData: payData,
          date: localStorage.getItem("selectedDate") || new Date().toISOString().split('T')[0]
        };
        
        localStorage.setItem("noticeData", JSON.stringify(noticeData));
        
        alert("회비 정보가 저장되었습니다.");
        window.history.back();
      }
    });
  
    // 초기화 함수 호출
    initFromLocalStorage();
  });