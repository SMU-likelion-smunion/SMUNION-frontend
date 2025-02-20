document.addEventListener("DOMContentLoaded", () => {

    const voteItemsContainer = document.getElementById("vote-items");
    const addItemBtn = document.getElementById("add-item-btn");
    const multipleChoiceOption = document.getElementById("multiple-choice");
    const anonymousVoteOption = document.getElementById("anonymous-vote");
    const cancelBtn = document.getElementById("cancel-btn");
    const submitBtn = document.getElementById("submit-btn");
  

    let isMultipleChoice = false;
    let isAnonymousVote = false;
    
    // 초기 상태 설정
    const initFromLocalStorage = () => {
      // 기존 저장값 불러오기
      const savedVoteData = localStorage.getItem("voteData");
      if (savedVoteData) {
        const voteData = JSON.parse(savedVoteData);
        
        // 옵션 복원
        isMultipleChoice = voteData.allowDuplicate || false;
        isAnonymousVote = voteData.anonymous || false;
        
        if (isMultipleChoice) {
          multipleChoiceOption.querySelector(".vote-option-circle").classList.add("selected");
        }
        
        if (isAnonymousVote) {
          anonymousVoteOption.querySelector(".vote-option-circle").classList.add("selected");
        }
        
        if (voteData.options && voteData.options.length > 0) {
          // 기존 항목 제거하고
          voteItemsContainer.innerHTML = '';
          
          // 저장된 항목 추가
          voteData.options.forEach(option => {
            addVoteItem(option);
          });
        }
      }
    };
    
    // 투표 항목 추가
    const addVoteItem = (value = '') => {
      const newItem = document.createElement("div");
      newItem.className = "vote-item";
      newItem.innerHTML = `
        <input type="text" placeholder="항목을 입력해주세요." value="${value}" />
        <button class="remove-btn">
          <i class="fa-solid fa-minus"></i>
        </button>
      `;
      voteItemsContainer.appendChild(newItem);
  
      const removeBtn = newItem.querySelector(".remove-btn");
      removeBtn.addEventListener("click", () => {
        if (voteItemsContainer.children.length > 2) {
          newItem.remove();
        } else {
            
          alert("투표 항목은 최소 두 개 이상이어야 합니다.");
        }
      });
  
      return newItem;
    };
  
    // 삭제 버튼 설정 함수
    function setupRemoveButtons() {
      const removeButtons = document.querySelectorAll(".remove-btn");
      removeButtons.forEach(button => {
        button.addEventListener("click", () => {
          
          if (voteItemsContainer.children.length > 2) {
            button.parentElement.remove();
          } else {
            // 투표 선택지를 2개보다 줄이려고 시도할 경우에
            alert("투표 항목은 최소 두 개 이상이어야 합니다.");
          }
        });
      });
    }
  
    // 초기 삭제 버튼
    setupRemoveButtons();
  

    addItemBtn.addEventListener("click", () => {
      const newItem = addVoteItem();
      const input = newItem.querySelector("input");
      input.focus();
    });
  
    multipleChoiceOption.addEventListener("click", () => {
      const circle = multipleChoiceOption.querySelector(".vote-option-circle");
      circle.classList.toggle("selected");
      isMultipleChoice = circle.classList.contains("selected");
    });
  
    anonymousVoteOption.addEventListener("click", () => {
      const circle = anonymousVoteOption.querySelector(".vote-option-circle");
      circle.classList.toggle("selected");
      isAnonymousVote = circle.classList.contains("selected");
    });
  

    const getVoteData = () => {
      const voteOptions = [];
      const inputs = voteItemsContainer.querySelectorAll("input");
      
      let hasEmptyItems = false;
      inputs.forEach(input => {
        if (input.value.trim() === "") {
          hasEmptyItems = true;
        }
        voteOptions.push(input.value.trim());
      });
  
      if (hasEmptyItems) {
        alert("모든 투표 항목을 입력해주세요.");
        return null;
      }
      
      if (voteOptions.length < 2) {
        alert("투표 항목은 최소 두 개 이상이어야 합니다.");
        return null;
      }
  
      return {
        options: voteOptions,
        allowDuplicate: isMultipleChoice,
        anonymous: isAnonymousVote
      };
    };
  
    cancelBtn.addEventListener("click", () => {
      window.history.back();
    });


    submitBtn.addEventListener("click", () => {
      const voteData = getVoteData();
      if (voteData) {

        localStorage.setItem("voteData", JSON.stringify(voteData));
        

        const noticeData = {
          type: "vote",
          title: localStorage.getItem("noticeTitle") || "",
          description: localStorage.getItem("noticeDescription") || "",
          targetDepartments: localStorage.getItem("targetDepartments") 
            ? JSON.parse(localStorage.getItem("targetDepartments")) 
            : ["전체"],
          voteData: voteData,
          date: localStorage.getItem("selectedDate") || new Date().toISOString().split('T')[0]
        };
        
        localStorage.setItem("noticeData", JSON.stringify(noticeData));
        
        alert("투표 정보가 저장되었습니다.");
        window.history.back();
      }
    });
  

    initFromLocalStorage();
  });