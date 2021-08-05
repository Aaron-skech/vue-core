const getscrollParent = (el)=>{
    let parent = el.parentNode;

    while(parent){
        if(/(scroll)|(auto)/.test(getComputedStyle(parent)['overflow'])){
            return parent;
        }
        parent = parent.parentNode;
    }
    return parent
}

const Lazy = ()=>{
    //...
    class ReactiveListener{   //每一个图片元素 都构造成一个类的实例
        constructor({el,src,options,elRender}){
            this.el =el;
            this.src=src;
            this.options = options;
            this.elRender = elRender;
            this.state = {
                loading:false,
            }
         } 
         checkInview(){   //检测这个图片是否在可视区域内
            let {top} = this.el.getBoundingClientRect();

            return top < window.innerHeight*(this.options.preLoad || 1.3);

        }

        load(){//用来加载这个图片
            //先加载loading
            //如果加载ok的话 显示正常 的图片
            this.elRender(this,'loading')
            //懒加载的核心就是new Image
            this.loadImageAsync(this,src,()=>{
                this.state.loading = true;
            })


        }


    }

    
    return class LazyClass{
        constructor(options){
            //保存用户传入的属性
            this.options = options;
            this.bindHandler = false;
            this.listenerQueue=[];

        };
        handleLazyLoad(){
           //这里判断是否应该显示这个图片
           //计算当前图片的位置
           this.listenerQueue.forEach(listener =>{
               let catIn = listener.checkInview();
               catIn && listener.load();
           })

        };
        add(el,bindings,vnode){
           //找到父亲元素
           Vue.nextTick(()=>{
               //获取带有滚动的盒子 infiniteScroll
               let scrollParent = getscrollParent(el);
               if(scrollParent && !this.bindHandler){
                   this.bindHandler = true;
                scrollParent.addEventListener('scroll',this.handleLazyLoad.bind(this))
               }
               //需要判断当前元素是否在容器可视区域中, 如果不是就不用渲染
               const listener = new ReactiveListener({
                   el,
                   src:bindings.value,
                   options:this.options,
                   elRender:this.elRender.bind(this)
               })
               //把所有的图片都创建一个实例 放到数组中
               this.listenerQueue.push(listener)
               this.handleLazyLoad();    })
        }
        elRender(listener,state){
            let el = listener.el;
            let src = '';
            switch(state){
                case'loading':
                  src = listener.options.loading || '';
                  break;
                case 'error':
                  src = listener.options.error || '';
                default:
                  src = this.src;
            }
            el.setAttribute('src',src);
        }

    }

}


const VueLazyload = {
    install(Vue,options){

        //把所有逻辑进行封装 类，把类封装到函数中
         
        const LazyClass = Lazy(Vue);
        const lazy = new LazyClass(options);
        Vue.directive('lazy',{
            bind:lazy.add.bind(lazy)
        })
    }

}