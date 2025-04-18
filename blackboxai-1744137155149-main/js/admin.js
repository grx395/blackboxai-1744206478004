document.addEventListener('DOMContentLoaded', () => {
    // Check admin authentication
    if (!isAdminAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // Elements
    const uploadForm = document.getElementById('uploadForm');
    const manageSongsList = document.getElementById('manageSongsList');
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const closeEditModal = document.getElementById('closeEditModal');
    const logoutBtn = document.getElementById('logoutBtn');

    // Initialize
    renderManageSongs();

    // Upload form handler
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('songName').value,
            composer: document.getElementById('composer').value,
            lyrics: document.getElementById('lyrics').value,
            tags: document.getElementById('tags').value,
            demoText: document.getElementById('demoText').value || 'Demo song'
        };

        const audioFile = document.getElementById('audioFile').files[0];
        let audioData = null;

        if (audioFile) {
            try {
                audioData = await readAudioFile(audioFile);
            } catch (error) {
                alert('Error processing audio file. Please try again.');
                return;
            }
        }

        const song = storage.addSong(formData, audioData);
        
        if (song) {
            uploadForm.reset();
            renderManageSongs();
            showNotification('Song uploaded successfully!');
        } else {
            showNotification('Error uploading song', 'error');
        }
    });

    // Edit form handler
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const songId = document.getElementById('editSongId').value;
        const audioFile = document.getElementById('editAudioFile').files[0];
        
        // Handle audio file if provided
        if (audioFile) {
            try {
                const audioData = await readAudioFile(audioFile);
                storage.updateAudioData(songId, audioData);
            } catch (error) {
                showNotification('Error processing audio file', 'error');
                return;
            }
        }

        const updatedSong = {
            name: document.getElementById('editSongName').value,
            composer: document.getElementById('editComposer').value,
            lyrics: document.getElementById('editLyrics').value,
            tags: document.getElementById('editTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            demoText: document.getElementById('editDemoText').value || 'Demo song'
        };

        if (storage.updateSong(songId, updatedSong)) {
            closeEditModal.click();
            renderManageSongs();
            showNotification('Song updated successfully!');
        } else {
            showNotification('Error updating song', 'error');
        }
    });

    // Close edit modal
    closeEditModal.addEventListener('click', () => {
        editModal.classList.add('hidden');
        editModal.classList.remove('flex');
    });

    // Logout handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminAuth');
        window.location.href = 'index.html';
    });

    function isAdminAuthenticated() {
        return localStorage.getItem('adminAuth') === 'true';
    }

    function renderManageSongs() {
        const songs = storage.getAllSongs();
        manageSongsList.innerHTML = '';

        if (songs.length === 0) {
            manageSongsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-music text-4xl text-gray-400 mb-2"></i>
                    <p class="text-gray-500">No songs available</p>
                </div>
            `;
            return;
        }

        songs.forEach(song => {
            const songElement = document.createElement('div');
            songElement.className = 'bg-white rounded-lg shadow p-4 flex items-center justify-between';
            
            songElement.innerHTML = `
                <div class="flex-1">
                    <h3 class="font-semibold">${song.name}</h3>
                    <p class="text-sm text-gray-600">${song.composer}</p>
                    <div class="flex flex-wrap gap-1 mt-1">
                        ${song.tags.map(tag => `
                            <span class="text-xs px-2 py-1 bg-gray-100 rounded-full">${tag}</span>
                        `).join('')}
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Demo Text: ${song.demoText || 'Demo song'}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="edit-btn p-2 text-blue-600 hover:bg-blue-50 rounded-full" data-id="${song.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn p-2 text-red-600 hover:bg-red-50 rounded-full" data-id="${song.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Edit button handler
            songElement.querySelector('.edit-btn').addEventListener('click', () => {
                const songToEdit = storage.getSong(song.id);
                showEditModal(songToEdit);
            });

            // Delete button handler
            songElement.querySelector('.delete-btn').addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this song?')) {
                    if (storage.deleteSong(song.id)) {
                        renderManageSongs();
                        showNotification('Song deleted successfully!');
                    } else {
                        showNotification('Error deleting song', 'error');
                    }
                }
            });

            manageSongsList.appendChild(songElement);
        });
    }

    function showEditModal(song) {
        document.getElementById('editSongId').value = song.id;
        document.getElementById('editSongName').value = song.name;
        document.getElementById('editComposer').value = song.composer;
        document.getElementById('editLyrics').value = song.lyrics;
        document.getElementById('editTags').value = song.tags.join(', ');
        document.getElementById('editDemoText').value = song.demoText || 'Demo song';

        // Show current audio status
        const currentAudioStatus = document.getElementById('currentAudioStatus');
        const hasAudio = storage.getAudioData(song.id) !== null;
        currentAudioStatus.textContent = hasAudio ? 'Current song has audio' : 'No audio file attached';
        currentAudioStatus.className = `text-sm ${hasAudio ? 'text-teal-600' : 'text-gray-500'} mt-1`;

        editModal.classList.remove('hidden');
        editModal.classList.add('flex');
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white transform transition-transform duration-300 translate-y-0`;
        
        notification.innerHTML = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('translate-y-full');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async function readAudioFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }
});
