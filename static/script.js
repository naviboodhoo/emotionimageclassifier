const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const previewDiv = document.getElementById('preview');

// Drag & drop styling
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

// Handle drop
dropArea.addEventListener('drop', (e) => {
  const files = Array.from(e.dataTransfer.files);
  handleFiles(files);
});

// Handle manual selection
fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  handleFiles(files);
});

// Core image handling logic
async function handleFiles(files) {
  previewDiv.innerHTML = '';

  for (const file of files) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(resolve => img.onload = resolve);

    // Resize image to 256x256 using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 256, 256);

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);

    let score, label, emoji;

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      score = result.score;
      label = score > 0.5 ? 'Sad' : 'Happy';
      emoji = score > 0.5 ? ':(' : ':)';
      console.log(`Prediction: ${label} (${score})`);

    } catch (err) {
      console.error('Prediction failed:', err);
      alert('Prediction failed. Please try again with a different image.');
      return; // Skip rendering if prediction fails
    }

    // UI: Show result
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
    info.appendChild(scoreLabel);
    info.appendChild(barContainer);

    container.appendChild(resultImage);
    container.appendChild(info);
    container.appendChild(emojiEl);
    previewDiv.appendChild(container);
  }
}
