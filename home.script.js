// ==========================================
// 📌 HOME PAGE INTERACTION & ANIMATION SCRIPT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    

// أنيميشن طفو ناعم جداً ومناسب للوضعية الجديدة
gsap.to("#heroCharacter", {
    y: -8,               // حركة بسيطة لأعلى ولأسفل حتى لا تظهر القطعة
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
});
    // 2. Audio Greeting Badge & Play Button Action
    const audioBtn = document.getElementById("playAudioBtn");
    let isPlaying = false;

    audioBtn.addEventListener("click", () => {
        isPlaying = !isPlaying;
        
        if (isPlaying) {
            // تغيير شكل الأيقونة إلى علامة الإيقاف مؤقتاً
            audioBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            alert("🎧 Playing Hind's Welcome Voice Note... (Voice player is ready to link your audio file!)");
        } else {
            // العودة لشكل التشغيل
            audioBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    });

});

