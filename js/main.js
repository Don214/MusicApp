//Tính năng phát và dừng nhạc
//Chay duoc nhac va biet duoc dang nghe duoc bao nhieu tren tong bai nhac
//Tua nhạc 
//Làm cơ chế tải lại bài nhạc
//Làm cơ chế chuyển và lui lại bài
// Chọn bài ngẫu nhiên
//Lưu lại được option cũ
const $ = document.querySelector.bind(document);
const musicApi = 'http://localhost:3000/songs';
const nameChoiceSong = $('header h2');
const PLAYER_STORAGE_KEY ='F8_PLAYER'
const cd =$('.cd')
const cdImg = $('.cd-thumb');
const audio = $('#audio');
const listMusic =$('.playlist')
const btn_playMusic = $('.btn-toggle-play')
const player = $('.player')
const progress = $('#progress')
const repeat = $('.btn-repeat')
const next = $('.btn-next')
const prev = $('.btn-prev')
const random = $('.btn-random')
let repeatActive = false;
let randomActive = false;
let dataLength  ;
let dataMusic;
let indexSong =0;
let randomSong;
let musicPlayed =[];
const Music = {
    config : JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
    setConfig(key,value){
        this.config[key] = value;
        localStorage.setItem(PLAYER_STORAGE_KEY,JSON.stringify(this.config))
    },
    getConfig(){
        if(Music.config.random != undefined){
            random.classList.toggle("active",Music.config.random);
            randomActive = Music.config.random;
        }
        if(Music.config.repeat != undefined){
            repeat.classList.toggle("active",Music.config.repeat);
            repeatActive = Music.config.repeat;
        }
    },   
    scrollInToView(){
      setTimeout(()=>{
        $('.song.active').scrollIntoView({
            behavior: "smooth", block: "center" })
      },200)
    },
    SetTime(){
        const fullSong = audio.duration;
        const timeSongNow = audio.currentTime;
        if(timeSongNow === fullSong){
            audio.currentTime = 0;
            audio.play();
        }
    },
    handleEvent(){
        let takeFullTime;
        let takeTimeNow;
        const _this = this;
        const animationCD = cdImg.animate([
            { transform: "rotate(360deg)" },
        ],{
            duration: 10000,
            iterations: Infinity,
        })
        animationCD.pause();
        let runMusic = false;
        const widthCD = cd.offsetWidth;
        document.onscroll = function(){
            const scroll = document.documentElement.scrollTop || window.scrollY;
            let sizeCD = widthCD - scroll;
            cd.style.width = sizeCD > 0 ? sizeCD +'px' : 0
            cd.style.opacity = sizeCD / widthCD;
       }
       listMusic.addEventListener('click',function(e){
        const song = e.target.closest('.song:not(.active)');
        const option = e.target.closest('.option');
           if(song || option){
                if(option){
                    alert('Tính năng đang được cập nhật')
                }else{
                    indexSong = Number(song.dataset.index);
                    if(player.classList.contains('playing')){
                        runMusic = !runMusic
                        player.classList.remove('playing');
                    }
                    progress.value = 0;
                    animationCD.cancel();
                    _this.connectAPI();
                }
           }
         
       })
       
       btn_playMusic.onclick = function(){
        takeFullTime = audio.duration;
        runMusic = !runMusic;
        player.classList.toggle('playing',runMusic);
        if(runMusic){
            audio.play();
            animationCD.play();
        }else{
            audio.pause();
            animationCD.pause();
        }
       }
       audio.ontimeupdate = function(){
        takeTimeNow = audio.currentTime;
        if(!isNaN(audio.duration)){
            progress.value = Math.floor((audio.currentTime / audio.duration) *100)
        }
        if(repeatActive){
            _this.SetTime()
        }
        if(takeTimeNow === takeFullTime && !repeatActive && !randomActive){
            progress.value = 0
            next.click();
        }
        if(takeTimeNow === takeFullTime && randomActive && !repeatActive){
            if(musicPlayed.length === dataLength){
                musicPlayed = []
            }
             do{
                randomSong = Math.floor(Math.random() * dataLength);
             }while(randomSong === indexSong || musicPlayed.includes(randomSong))
             musicPlayed.push(randomSong);
            indexSong = randomSong;
            _this.connectAPI();
            _this.scrollInToView();
            animationCD.cancel();
            if(player.classList.contains('playing')){
                runMusic = !runMusic
                player.classList.remove('playing');
            }
            progress.value = 0;
        }
        
     }
        progress.onchange = function(){
           const seekTime = progress.value/100 * audio.duration;
            audio.currentTime = seekTime;
        }

        repeat.onclick = function(){
            repeatActive =!repeatActive;
            _this.setConfig('repeat', repeatActive)
            if(repeatActive){
                repeat.classList.add("active");
            }else{
                repeat.classList.remove("active");
            }
        }

        next.onclick = function(){
            if(randomActive){
                if(musicPlayed.length === dataLength){
                    musicPlayed = []
                }
                 do{
                    randomSong = Math.floor(Math.random() * dataLength);
                 }while(randomSong === indexSong || musicPlayed.includes(randomSong))
                 musicPlayed.push(randomSong);
                 
                indexSong = randomSong;
            }else{
                indexSong++;
                if(indexSong === dataLength){
                    indexSong = 0;
                }
            }
            if(runMusic){
                runMusic = false;
                player.classList.remove('playing');
            }
            progress.value = 0;
            animationCD.cancel();
            _this.connectAPI();
            _this.scrollInToView();
        }

        prev.onclick = function(){
            if(randomActive){
                if(musicPlayed.length === dataLength){
                    musicPlayed = []
                }
                 do{
                    randomSong = Math.floor(Math.random() * dataLength);
                 }while(randomSong === indexSong || musicPlayed.includes(randomSong))
                 musicPlayed.push(randomSong);
                 console.log(musicPlayed);
                indexSong = randomSong;
            }else{
                indexSong--;
                if(indexSong < 0){
                    indexSong = dataLength -1;
                }
            }
            if(runMusic){
                runMusic = false;
                player.classList.remove('playing');
            }
            progress.value = 0;
            animationCD.cancel();
            _this.connectAPI();
            _this.scrollInToView();
        }

        random.onclick = function(){
            randomActive =!randomActive;
            _this.setConfig('random', randomActive)
            random.classList.toggle("active",randomActive);
        }
    },
    connectAPI(){
        fetch(musicApi)
            .then((response) => response.json())
            .then(function(dataparse){
                Music.renderMusicChoice(dataparse);
                Music.renderListMusic(dataparse);
                dataLength = dataparse.length;

            })
    },
    renderListMusic(dataSong){
       const html = dataSong.reduce((archive,element,index)=>{
            return archive + `<div class="song ${index === indexSong ? 'active':'' }" data-index = ${index}>
            <div class="thumb" style="background-image: url(${element.img})">
            </div>
            <div class="body">
                <h3 class="title">${element.name}</h3>
                <p class="author">${element.singer}</p>
            </div>
            <div class="option">
                <i class="fas fa-ellipsis-h"></i>
            </div>
            </div>`
        },'');

        listMusic.innerHTML = html;

    },renderMusicChoice(dataSong){
       const html = dataSong.forEach((element,index) => {
            if(index === indexSong){
                nameChoiceSong.innerText = `${element.name}`
                cdImg.style.backgroundImage = `url(${element.img})`
                audio.src = `${element.path}`

            }
       });

    },
    start(){
        //Kết nối API
        this.connectAPI();
        //Chạy các tự kiện
        this.handleEvent();
        //Thay đổi thuộc tính
        this.getConfig();
    }
}
Music.start()



