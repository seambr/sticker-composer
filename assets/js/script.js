let currentResultsList = []
let currentResultIndex = 0
let selectedStickers = []
const indexLabel = document.getElementById("result-index-label")

const pageSelector = document.getElementById("result-index-controls")

pageSelector.addEventListener("wheel", (e) => {
  e.preventDefault()
  handlePageScroll(e)
})

function handlePageScroll(e) {
  if (e.wheelDelta > 0) {
    decrementResultIndex()
  } else {
    incrementResultIndex()
  }
}
function decrementResultIndex() {
  const newIndex = currentResultIndex - 1

  if (newIndex >= 0 && newIndex < currentResultsList.length - 1) {
    currentResultIndex -= 1
    populateResults(currentResultIndex)
  }
}
function incrementResultIndex() {
  const newIndex = currentResultIndex + 1

  if (newIndex > 0 && newIndex <= currentResultsList.length - 1) {
    currentResultIndex += 1
    populateResults(currentResultIndex)
  }
}

function populateResults(resultIndex = 0) {
  let inputVal = document.getElementById("stickerInput").value
  inputVal = inputVal.replace(/[^a-zA-Z0-9]/g, "")
  let results = currentResultsList[resultIndex]

  selectedStickers = []
  const resultIndexControls = document.getElementById("result-index-controls")

  if (currentResultsList.length > 1) {
    resultIndexControls.style.display = "flex"
  } else {
    resultIndexControls.style.display = "none"
  }

  indexLabel.innerText = `${currentResultIndex + 1}/${currentResultsList.length}`
  const resultsDiv = document.getElementById("results")
  resultsDiv.innerHTML = ""

  results.forEach((result, i) => {
    const groupDiv = document.createElement("div")
    groupDiv.classList.add("result-group")

    const matchedPartSpan = document.createElement("span")
    matchedPartSpan.classList.add("matched-part")
    matchedPartSpan.textContent = result.matchedLoc
      ? `${result.matchedLoc} : `
      : ""
    matchedPartSpan.textContent += result.matchedPart.toUpperCase()

    groupDiv.appendChild(matchedPartSpan)

    // Add a check to see if this position already has a selected sticker
    const hasSelectedSticker = selectedStickers[i]?.sticker

    result.stickers.forEach((sticker) => {
      const stickerWrapper = document.createElement("div")
      stickerWrapper.classList.add("sticker-wrapper")
      stickerWrapper.setAttribute("data-name", sticker.name)

      // If there's already a sticker selected for this position, add a visual indicator
      if (hasSelectedSticker) {
        stickerWrapper.style.opacity = "0.5"
        stickerWrapper.style.cursor = "not-allowed"
      }

      const image = document.createElement("img")
      image.src = sticker.image
      image.alt = sticker.name
      image.classList.add("sticker-image")

      let isAdding = false

      stickerWrapper.onclick = async () => {
        // If we're already adding this sticker or there's a sticker already selected, ignore the click
        if (isAdding || hasSelectedSticker) return

        isAdding = true
        stickerWrapper.style.opacity = "0.5"

        selectedStickers[i].sticker = sticker
        selectedStickers[i].index = i
        await renderSelectedStickers(selectedStickers)

        isAdding = false
      }

      stickerWrapper.appendChild(image)
      groupDiv.appendChild(stickerWrapper)
    })

    selectedStickers.push({ matchedPart: result.matchedPart })
    resultsDiv.appendChild(groupDiv)
  })

  const selectedStickersList = document.getElementById("selectedStickers")
  const addToCanvasButton = document.getElementById("add-selected-to-canvas")
  const inputValLower = inputVal.toLowerCase()

  if (results.length <= 0) {
    displayInfoMessage("No matches found for your input.", inputVal)
    selectedStickersList.style.display = "none"
    addToCanvasButton.style.display = "none"
  } else if (
    results
      .flat()
      .map((x) => x.matchedPart)
      .join("") !== inputValLower
  ) {
    displayInfoMessage("Could not match the entire input.", inputVal)
    selectedStickersList.style.display = "none"
    addToCanvasButton.style.display = "none"
  } else {
    selectedStickersList.style.display = "flex"
    addToCanvasButton.style.display = "flex"
    clearInfoMessage()
  }
  renderSelectedStickers(selectedStickers)
}

function rotateResults(direction) {
  // direction is +-1
  const newIndex = currentResultIndex + direction

  if (newIndex < currentResultIndex.length - 1 && newIndex > 0) {
    populateResults(newIndex)
  }
}

async function callWorker() {
  let inputVal = document.getElementById("stickerInput").value
  // Remove spaces and special characters, keeping only letters and numbers
  inputVal = inputVal.replace(/[^a-zA-Z0-9]/g, "")
  const isBackwards = document.getElementById("isBackwards").checked
  const isDepth = document.getElementById("isDepth").checked

  const apiUrl = `https://sticker-craft.cryck.workers.dev/?input=${encodeURIComponent(
    inputVal
  )}&isBackwards=${isBackwards}&isDepth=${isDepth}`

  try {
    const response = await fetch(apiUrl)
    // results now has an additional layer for each permuation
    currentResultsList = await response.json()

    if (
      isDepth &&
      !Array.isArray(currentResultsList[currentResultsList.length - 1])
    ) {
      currentResultsList = convertDeepResults(currentResultsList)
    }
    currentResultIndex = 0
    populateResults(currentResultIndex)
  } catch (error) {
    console.error("Error fetching data:", error)
  }
}

function displayInfoMessage(reason, inputVal) {
  const div = document.createElement("div")

  const text = document.createElement("span")
  text.classList.add("info-message")
  text.innerHTML = `${reason} Try another search term or try this other tool: `

  const link = document.createElement("a")
  link.href = `https://stickertool.pcpie.nl/?input=${encodeURIComponent(
    inputVal
  )}`
  link.textContent = "stickertool.pcpie.nl"
  link.target = "_blank"

  div.appendChild(text)
  div.appendChild(link)

  document.getElementById("infoContainer").replaceChildren(div)
}

function clearInfoMessage() {
  const infoContainer = document.getElementById("infoContainer")
  infoContainer.innerHTML = ""
}

document
  .getElementById("stickerInput")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      callWorker()
    }
  })

  async function renderSelectedStickers(selectedStickers) {
    const selectedStickersList = document.getElementById("selectedStickers")
    selectedStickersList.innerHTML = ""
    if (!selectedStickers.length) return
  
    const title = document.createElement("li")
    title.classList.add("selected-sticker-item")
    title.textContent = "Selected:"
    selectedStickersList.appendChild(title)
  
    let totalPrice = 0
  
    // Process each sticker
    for (const selected of selectedStickers) {
      const selectedStickerItem = document.createElement("li")
      selectedStickerItem.classList.add("selected-sticker-item")
      const selectedStickerHeader = document.createElement("div")
      selectedStickerHeader.classList.add("selected-sticker-header")
      selectedStickerHeader.textContent = selected.matchedPart.toUpperCase()
      selectedStickerItem.appendChild(selectedStickerHeader)
  
      if (selected.sticker) {
        const image = document.createElement("img")
        image.src = selected.sticker.image
        image.alt = selected.sticker.name
        image.classList.add("sticker-image")
  
        // Remove sticker from selectedStickers on click
        image.onclick = () => {
          selectedStickers[selected.index].sticker = null
          renderSelectedStickers(selectedStickers)
        }
        selectedStickerItem.appendChild(image)
  
        const selectedStickerInfo = document.createElement("a")
        selectedStickerInfo.classList.add("selected-sticker-info")
        selectedStickerInfo.textContent = selected.sticker.name
        selectedStickerInfo.href = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(
          selected.sticker.name
        )}`
        selectedStickerInfo.target = "_blank"
        selectedStickerInfo.draggable = false
        selectedStickerItem.appendChild(selectedStickerInfo)
  
        // Fetch and add price
        try {
          const response = await fetch(`https://de.cryck.me/get_sticker_price.php?pattern=${encodeURIComponent(selected.sticker.name)}`)
          const data = await response.json()
          
          if (data.success && data.data && data.data[0]) {
            const price = parseFloat(data.data[0].price)
            
            const priceElement = document.createElement("div")
            priceElement.classList.add("selected-sticker-price")
            priceElement.textContent = `$${price.toFixed(2)}`
            selectedStickerItem.appendChild(priceElement)
            
            totalPrice += price
          }
        } catch (error) {
          console.error('Error fetching price:', error)
        }
      }
  
      selectedStickersList.appendChild(selectedStickerItem)
    }
  
    // Add total price if there are any prices
    if (totalPrice > 0) {
      const totalElement = document.createElement("li")
      totalElement.classList.add("selected-sticker-total")
      totalElement.innerHTML = `
        <div>Total</div>
        <div class="selected-sticker-total-price">$${totalPrice.toFixed(2)}</div>
      `
      selectedStickersList.appendChild(totalElement)
    }
  }

document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search)
  const inputParam = params.get("input")
  if (inputParam) {
    document.getElementById("stickerInput").value =
      decodeURIComponent(inputParam)
    callWorker()
  }
})

function convertDeepResults(results) {
  // They worker also sent stickers_by_id
  const stickersById = currentResultsList.pop()
  return currentResultsList.map((page) => {
    return page.map((col) => {
      return {
        ...col,
        stickers: col.stickers.map((id) => stickersById[id]),
      }
    })
  })
}

function pushStickersToCanvas() {
  console.log(selectedStickers)
  if (!selectedStickers) {
    console.error("Not enough selected stickers.")
    return
  }

  const slotParams = selectedStickers
    .slice(0, 5)
    .map((selected, index) => {
      if (selected.sticker && selected.sticker.id) {
        return `slot${index}=${selected.sticker.id}`
      } else {
        return ""
      }
    })
    .join("&")

  window.open(`/canvas.html?${slotParams}`, "_blank")
}
