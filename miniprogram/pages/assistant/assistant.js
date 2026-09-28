const {request}=require('../../utils/api');

Page({
  data:{
    messages:[],
    message:'',
    reply:'',
    busy:false,
    error:'',
    aiSteps:[],
    loadingText:'正在想…',
    suggestions:['帮我推荐一条古村路线','芙蓉古村有什么特色','今天天气怎么样','我想带孩子慢慢逛']
  },
  history:[],

  onLoad(){
    const greeting='你好呀～我是永嘉有礼的文旅管家。想聊哪里、怎么逛，或者有什么情绪想分享，都可以说。';
    this.setData({messages:[{role:'assistant',content:greeting}]});
  },

  input(e){this.setData({message:e.detail.value});},

  useSuggestion(e){const text=e.currentTarget.dataset.text;this.setData({message:text});this._doSend(text);},

  send(){this._doSend(this.data.message.trim());},

  _doSend(text){
    if(this.data.busy||!text)return;

    const userMsg={role:'user',content:text};
    const messages=this.data.messages.concat(userMsg);
    this.setData({messages,busy:true,error:'',aiSteps:[],message:'',loadingText:'正在想…'});

    request('/api/agent',{message:text,history:this.history})
      .then(r=>{
        const assistantMsg={role:'assistant',content:r.text||'已完成查询。'};
        this.history.push(userMsg,{role:'assistant',content:assistantMsg.content});
        this.history=this.history.slice(-8);
        this.setData({messages:messages.concat(assistantMsg),aiSteps:r.steps||[]});

        if(r.plan){
          getApp().globalData.plan=r.plan;
          wx.setStorageSync('youli-plan-v2',JSON.stringify(r.plan));
          wx.showToast({title:'已同步到行程',icon:'none'});
        }
      })
      .catch(e=>{
        this.setData({error:e.message,loadingText:'出错了，请重试'});
      })
      .finally(()=>this.setData({busy:false}));
  }
});
