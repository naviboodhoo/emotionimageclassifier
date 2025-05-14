const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const previewDiv = document.getElementById('preview');

// Drag & drop events
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropArea.classList.add('hover');
  });
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropArea.classList.remove('hover');
  });
});

dropArea.addEventListener('drop', (e) => {
  const files = Array.from(e.dataTransfer.files);
  handleFiles(files);
});

fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  handleFiles(files);
});

async function handleFiles(files) {
  previewDiv.innerHTML = '';

  for (const file of files) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(resolve => img.onload = resolve);

    // Resize to 256x256 using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 256, 256);

    // Send file to backend using FormData
    const formData = new FormData();
    formData.append('file', file);

   // const response = await fetch('http://localhost:5000/predict', {
   //   method: 'POST',
   //   body: formData
   // });
    const response = await fetch('/predict', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    const score = result.score;
    const label = score > 0.5 ? 'Sad' : 'Happy';
    const emoji = score > 0.5 ? ':(' : ':)';

    // UI
    const container = document.createElement('div');
    container.className = 'result';

    const resultImage = new Image();
    resultImage.src = canvas.toDataURL();
    resultImage.width = 150;

    const info = document.createElement('div');

    const labelEl = document.createElement('div');
    labelEl.className = 'label';
    labelEl.textContent = `${label} (${(score * 100).toFixed(1)}%)`;

    const scoreLabel = document.createElement('div');
    scoreLabel.textContent = 'Confidence Score:';
    scoreLabel.style.marginTop = '10px';
    scoreLabel.style.fontWeight = 'bold';

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = `${(score * 100).toFixed(1)}%`;
    bar.textContent = `${(score * 100).toFixed(1)}%`;

    barContainer.appendChild(bar);

    const emojiEl = document.createElement('div');
    emojiEl.className = 'emoji';
    emojiEl.textContent = emoji;

    info.appendChild(labelEl);
    info.appendChild(scoreLabel);  // Confidence Score label added here
    info.appendChild(barContainer);

    container.appendChild(resultImage);
    container.appendChild(info);
    container.appendChild(emojiEl);
    previewDiv.appendChild(container);
  }
}
