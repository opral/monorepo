import App from "./assets/categories/app.jsx";
import Email from "./assets/categories/email.jsx";
import Payments from "./assets/categories/payments.jsx";
import Website from "./assets/categories/website.jsx";
import Documents from "./assets/categories/documents.jsx";
import { CardTag } from "../../components/CardTag.jsx";
import "solid-slider/slider.css";
import CardGradient from "../../components/CardGradient.jsx";
import { onMount } from "solid-js";

export default function CategorySlider() {
  let slider: HTMLDivElement | undefined;

  const animateCards = () => {
    const firstCard = slider?.children[0] as HTMLDivElement;
    firstCard.classList.add("animate-fadeOut");
    const gap = window.innerWidth < 768 ? 24 : 16;
    for (const sliderChild of slider?.children as HTMLCollectionOf<HTMLDivElement>) {
      if (sliderChild === firstCard) continue;
      sliderChild.style.transitionProperty = "all";
      sliderChild.style.transitionDuration = "500ms";
      sliderChild.style.transform = `translate(-${firstCard.offsetWidth + gap}px, 0px)`;
    }

    setTimeout(() => {
      // remove transition animation from all cards
      for (const sliderChild of slider?.children as HTMLCollectionOf<HTMLDivElement>) {
        if (sliderChild === firstCard) continue;
        sliderChild.style.transitionProperty = "none";
      }
      // move the first card to the end of the list
      slider?.appendChild(firstCard);
      firstCard.classList.remove("animate-fadeOut");
      firstCard.classList.add("animate-fadeIn");
      // reset transform of all cards and add transition animation
      for (const sliderChild of slider?.children as HTMLCollectionOf<HTMLDivElement>) {
        sliderChild.style.transform = `translate(0px, 0px)`;
      }
    }, 500);
  };

  onMount(() => {
    setInterval(() => {
      animateCards();
    }, 3000);
  });

  return (
    <div class="w-[calc(100%_-_24px)] md:w-[calc(100%_-_16px)] h-64 pl-6 md:pl-4 overflow-hidden">
      <div ref={slider} class="flex h-full w-max gap-6 md:gap-4">
        <div class="w-[416px] h-64 transition-all duration-200">
          <div class="flex justify-center items-center">
            <div class="w-full h-64 bg-surface-800 rounded-2xl flex-shrink-0 relative">
              <div class="z-10 absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 overflow-hidden opacity-80">
                <App />
              </div>
              <CardTag text="App" globalPrefix />
              <CardGradient />
            </div>
          </div>
        </div>
        <div class="w-[255px] h-64 transition-all duration-200">
          <div class="flex justify-center items-center">
            <div class="max-w-sm w-full h-64 bg-surface-600 rounded-2xl flex-shrink-0 relative">
              <div class="z-10 absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 overflow-hidden opacity-80">
                <Payments />
              </div>
              <CardTag text="Payment" globalPrefix />
              <CardGradient />
            </div>
          </div>
        </div>
        <div class="w-[269px] h-64 transition-all duration-200">
          <div class="flex justify-center items-center">
            <div class="w-full h-64 bg-[#043855] rounded-2xl flex-shrink-0 relative overflow-hidden">
              <div class="z-10 absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 overflow-hidden opacity-80">
                <Email />
              </div>
              <CardTag text="Email" globalPrefix />
              <CardGradient />
            </div>
          </div>
        </div>
        <div class="w-[384px] h-64 transition-all duration-200">
          <div class="flex justify-center items-center">
            <div class="max-w-sm w-full h-64 bg-surface-800 rounded-2xl flex-shrink-0 relative">
              <div class="z-10 absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 overflow-hidden opacity-80">
                <Website />
              </div>
              <CardTag text="Website" globalPrefix />
              <CardGradient />
            </div>
          </div>
        </div>
        <div class="w-64 h-64 transition-all duration-200">
          <div class="flex justify-center items-center">
            <div class="max-w-sm w-full h-64 bg-[#043855] rounded-2xl flex-shrink-0 relative">
              <div class="z-10 absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 overflow-hidden opacity-80">
                <Documents />
              </div>
              <CardTag text="Documents" globalPrefix />
              <CardGradient />
            </div>
          </div>
        </div>
      </div>
      <div
        class="z-20 absolute top-0 right-0 w-32 md:w-80 h-64 mr-6 md:mr-4"
        style={{
          background:
            "linear-gradient(270deg, #0F172A 0%, rgba(15, 23, 42, 0.00) 100%)",
        }}
      />
    </div>
  );
}
