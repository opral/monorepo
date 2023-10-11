import { Button } from "../../components/Button.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import LixGraph from "./assets/images/LixGraph.jsx"
import Rules from "./assets/images/Rules.jsx"
import IconError from "~icons/material-symbols/error-outline.svg"
import type { JSX } from "solid-js"
import Review from "./assets/images/Review.jsx"
import Automation from "./assets/images/Automation.jsx"
import Collaboration from "./assets/images/Collaboration.jsx"

const Lix = () => {
  return (
    <>
      <SectionLayout showLines={true} type="blue">
        <div class="w-full flex pt-4 md:pt-20 flex-col xl:flex-row">
          <div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-4 xl:py-16 pt-20 py-6">
            <h1 class="text-[40px] leading-tight md:text-6xl font-bold text-surface-500 pr-16 tracking-tight">
              Built-on <br />
              <span class="text-surface-200">
                Change Control
              </span>
            </h1>
          </div>
          <div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-4 xl:pt-16 pt-4 pb-16">
            <p class="text-surface-300 text-xl max-w-md">
              With inlang's change control system Lix, you have full control about changes in your system.
            </p>
            <div class="flex md:items-center items-start gap-8">
              <Button type="textPrimaryOnDark" href="#" chevron>
                Learn more about Lix
              </Button>
            </div>
          </div>
        </div>
        <div class="flex justify-center">
          <LixGraph />
        </div>
        <div class="grid grid-cols-4 gap-8 pt-16 pb-32 px-6 md:px-4 xl:py-16">
          <Card
            class="col-span-2"
            title="Rules"
            description="Enable team-wide quality checks that can be resolved automatically."
            icon={<IconError class="w-7 h-7 text-surface-200" />}
            image={
              <>
                <div class="h-80" />
                <Rules class="absolute top-14 right-10" />
              </>
            }
          />
          <Card
            class="col-span-2"
            title="Review"
            description="Include who is needed inside a flexible review workflow."
            icon={<IconCheck />}
            image={
              <div class="flex justify-center">
                <div class="h-80" />
                <Review class="absolute top-0 left-auto right-auto" />
              </div>
            }
          />
          <Card
            class="col-span-4"
            title="Collaboration"
            description="Everyone in the team can work seamlessly together on the same data."
            icon={<IconChat />}
            image={<Collaboration class="absolute right-0 top-0" />}
          />
          <Card
            class="col-span-2"
            title="Automation"
            description="Out of the box automations can transform in highly customizable processes."
            icon={<IconAutomation />}
            image={<Automation class="absolute right-0 top-6" />}
          />
          <Card
            title="Traceability"
            description="Know why a decision was made and how things evolved."
            icon={<IconTracebility />}
          />
          <Card
            title="Recovery"
            description="Always go back before things went wrong."
            icon={<IconRecovery />}
          />
        </div>
      </SectionLayout >
    </>
  )
}

export default Lix

const Card = (props: {
  class?: string
  title: string
  description: string
  icon: JSX.Element
  image?: JSX.Element
}) => {
  return (
    <div class={"min-h-[244px] p-6 flex flex-col justify-between rounded-[20px] relative bg-[#283548] " + props.class}>
      <div class="flex justify-center items-center w-10 h-10 gap-2.5 rounded-lg bg-background/[0.16]">
        {props.icon}
      </div>
      {props.image}
      <div class="w-fit h-fit">
        <p class="w-fit text-2xl font-semibold text-left text-background pb-2">{props.title}</p>
        <p class="min-h-[72px] max-w-[230px] text-base font-medium text-left text-surface-400">
          {props.description}
        </p>
      </div>
    </div>
  )
}

export const IconCheck = () => {
  return (
    <svg
      width={22}
      height={17}
      viewBox="0 0 22 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="flex-grow-0 flex-shrink-0"
      preserveAspectRatio="none"
    >
      <path
        d="M2 8.31284L7.79232 14.1042L20 1.89648"
        stroke="#DBDCDF"
        stroke-width="2.7"
        stroke-linecap="round"
      />
    </svg>
  )
}

export const IconChat = () => {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="flex-grow-0 flex-shrink-0 w-6 h-6 relative"
      preserveAspectRatio="none"
    >
      <path
        d="M5 18V21.766L6.515 20.857L11.277 18H16C17.103 18 18 17.103 18 16V8C18 6.897 17.103 6 16 6H4C2.897 6 2 6.897 2 8V16C2 17.103 2.897 18 4 18H5ZM4 8H16V16H10.723L7 18.234V16H4V8Z"
        fill="#DBDCDF"
      />
      <path
        d="M20 2H8C6.897 2 6 2.897 6 4H18C19.103 4 20 4.897 20 6V14C21.103 14 22 13.103 22 12V4C22 2.897 21.103 2 20 2Z"
        fill="#DBDCDF"
      />
    </svg>
  )
}

export const IconAutomation = () => {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="flex-grow-0 flex-shrink-0 w-6 h-6 relative"
      preserveAspectRatio="none"
    >
      <path
        d="M8.625 8.5H4.125C3.85978 8.5 3.60543 8.39464 3.41789 8.20711C3.23036 8.01957 3.125 7.76522 3.125 7.5V3C3.125 2.73478 3.23036 2.48043 3.41789 2.29289C3.60543 2.10536 3.85978 2 4.125 2C4.39022 2 4.64457 2.10536 4.83211 2.29289C5.01964 2.48043 5.125 2.73478 5.125 3V6.5H8.625C8.89022 6.5 9.14457 6.60536 9.33211 6.79289C9.51964 6.98043 9.625 7.23478 9.625 7.5C9.625 7.76522 9.51964 8.01957 9.33211 8.20711C9.14457 8.39464 8.89022 8.5 8.625 8.5Z"
        fill="#DBDCDF"
      />
      <path
        d="M20.9965 13.0001C20.7313 13.0001 20.4769 12.8947 20.2894 12.7072C20.1018 12.5197 19.9965 12.2653 19.9965 12.0001C19.9972 10.2396 19.4169 8.52815 18.3456 7.13121C17.2742 5.73427 15.7718 4.72999 14.0713 4.27423C12.3709 3.81846 10.5676 3.93668 8.94117 4.61055C7.31478 5.28442 5.95629 6.47625 5.07649 8.0011C4.94361 8.23065 4.72499 8.39801 4.46873 8.46636C4.21246 8.53472 3.93953 8.49848 3.70999 8.3656C3.48044 8.23273 3.31308 8.01411 3.24472 7.75784C3.17637 7.50157 3.21261 7.22865 3.34549 6.9991C4.44574 5.09334 6.14417 3.60395 8.1773 2.76199C10.2104 1.92003 12.4646 1.77257 14.5901 2.34249C16.7155 2.91241 18.5935 4.16784 19.9327 5.91403C21.2718 7.66022 21.9973 9.79954 21.9965 12.0001C21.9965 12.2653 21.8911 12.5197 21.7036 12.7072C21.5161 12.8947 21.2617 13.0001 20.9965 13.0001ZM19.8715 22.0001C19.6063 22.0001 19.3519 21.8947 19.1644 21.7072C18.9768 21.5197 18.8715 21.2653 18.8715 21.0001V17.5001H15.3715C15.1063 17.5001 14.8519 17.3947 14.6644 17.2072C14.4768 17.0197 14.3715 16.7653 14.3715 16.5001C14.3715 16.2349 14.4768 15.9805 14.6644 15.793C14.8519 15.6055 15.1063 15.5001 15.3715 15.5001H19.8715C20.1367 15.5001 20.3911 15.6055 20.5786 15.793C20.7661 15.9805 20.8715 16.2349 20.8715 16.5001V21.0001C20.8715 21.2653 20.7661 21.5197 20.5786 21.7072C20.3911 21.8947 20.1367 22.0001 19.8715 22.0001Z"
        fill="#DBDCDF"
      />
      <path
        d="M12 22C9.34881 21.9968 6.80712 20.9422 4.93244 19.0676C3.05776 17.1929 2.00318 14.6512 2 12C2 11.7348 2.10536 11.4804 2.29289 11.2929C2.48043 11.1054 2.73478 11 3 11C3.26522 11 3.51957 11.1054 3.70711 11.2929C3.89464 11.4804 4 11.7348 4 12C3.99924 13.7605 4.57956 15.472 5.65091 16.8689C6.72225 18.2658 8.22472 19.2701 9.92516 19.7259C11.6256 20.1816 13.4289 20.0634 15.0553 19.3896C16.6817 18.7157 18.0402 17.5239 18.92 15.999C18.9858 15.8853 19.0733 15.7858 19.1776 15.7059C19.2819 15.6261 19.4009 15.5676 19.5278 15.5337C19.6547 15.4999 19.787 15.4914 19.9172 15.5087C20.0473 15.5259 20.1728 15.5687 20.2865 15.6345C20.4002 15.7003 20.4997 15.7878 20.5796 15.8921C20.6594 15.9964 20.7179 16.1154 20.7518 16.2423C20.7856 16.3692 20.7941 16.5015 20.7768 16.6317C20.7596 16.7618 20.7168 16.8873 20.651 17.001C19.7715 18.5175 18.51 19.777 16.9921 20.6541C15.4743 21.5312 13.7531 21.9953 12 22Z"
        fill="#DBDCDF"
      />
    </svg>
  )
}

const IconTracebility = () => {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="flex-grow-0 flex-shrink-0 w-6 h-6 relative"
      preserveAspectRatio="none"
    >
      <g clip-path="url(#clip0_1368_8805)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M10.4993 2C9.14387 2.00012 7.80814 2.32436 6.60353 2.94569C5.39893 3.56702 4.36037 4.46742 3.57451 5.57175C2.78866 6.67609 2.27829 7.95235 2.08599 9.29404C1.89368 10.6357 2.02503 12.004 2.46906 13.2846C2.91308 14.5652 3.65692 15.7211 4.63851 16.6557C5.6201 17.5904 6.81098 18.2768 8.11179 18.6576C9.4126 19.0384 10.7856 19.1026 12.1163 18.8449C13.447 18.5872 14.6967 18.015 15.7613 17.176L19.4133 20.828C19.6019 21.0102 19.8545 21.111 20.1167 21.1087C20.3789 21.1064 20.6297 21.0012 20.8151 20.8158C21.0005 20.6304 21.1057 20.3796 21.108 20.1174C21.1102 19.8552 21.0094 19.6026 20.8273 19.414L17.1753 15.762C18.1633 14.5086 18.7784 13.0024 18.9504 11.4157C19.1223 9.82905 18.8441 8.22602 18.1475 6.79009C17.4509 5.35417 16.3642 4.14336 15.0116 3.29623C13.659 2.44911 12.0952 1.99989 10.4993 2ZM3.99928 10.5C3.99928 8.77609 4.6841 7.12279 5.90308 5.90381C7.12207 4.68482 8.77537 4 10.4993 4C12.2232 4 13.8765 4.68482 15.0955 5.90381C16.3145 7.12279 16.9993 8.77609 16.9993 10.5C16.9993 12.2239 16.3145 13.8772 15.0955 15.0962C13.8765 16.3152 12.2232 17 10.4993 17C8.77537 17 7.12207 16.3152 5.90308 15.0962C4.6841 13.8772 3.99928 12.2239 3.99928 10.5Z"
          fill="#E0E2E4"
        />
      </g>
      <defs>
        <clipPath id="clip0_1368_8805">
          <rect width={24} height={24} fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

const IconRecovery = () => {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="flex-grow-0 flex-shrink-0 w-7 h-7 relative"
      preserveAspectRatio="none"
    >
      <path
        d="M22.4624 14.0007C22.4625 12.4216 22.0205 10.8741 21.1865 9.53328C20.3525 8.19244 19.1599 7.11182 17.7435 6.41373C16.3272 5.71563 14.7437 5.42794 13.1724 5.58322C11.601 5.73849 10.1044 6.33053 8.85211 7.29233H9.62911C9.93853 7.29233 10.2353 7.41525 10.4541 7.63404C10.6729 7.85283 10.7958 8.14958 10.7958 8.459C10.7958 8.76842 10.6729 9.06516 10.4541 9.28395C10.2353 9.50275 9.93853 9.62566 9.62911 9.62566H6.12911C5.81969 9.62566 5.52294 9.50275 5.30415 9.28395C5.08536 9.06516 4.96244 8.76842 4.96244 8.459V8.16733H4.92278L4.96244 8.10666V4.959C4.96244 4.64958 5.08536 4.35283 5.30415 4.13404C5.52294 3.91525 5.81969 3.79233 6.12911 3.79233C6.43853 3.79233 6.73527 3.91525 6.95407 4.13404C7.17286 4.35283 7.29577 4.64958 7.29577 4.959V5.547C9.20213 4.02962 11.5676 3.2052 14.0041 3.209C16.1947 3.2093 18.3334 3.87628 20.1359 5.12129C21.9383 6.36631 23.3192 8.13038 24.095 10.1791C24.8707 12.2277 25.0046 14.464 24.4789 16.5906C23.9531 18.7172 22.7926 20.6335 21.1516 22.0847C19.5106 23.5359 17.4668 24.4533 15.2919 24.715C13.1169 24.9768 10.9138 24.5704 8.97541 23.5499C7.03699 22.5294 5.45503 20.9431 4.4398 19.0019C3.42458 17.0607 3.02416 14.8566 3.29177 12.6823C3.36527 12.085 3.89377 11.6673 4.49577 11.6673C5.18411 11.6673 5.68227 12.3312 5.60294 13.016C5.46923 14.1603 5.57068 15.3198 5.90107 16.4234C6.23145 17.5271 6.78382 18.5516 7.52429 19.4342C8.26475 20.3168 9.1777 21.0388 10.2072 21.5559C11.2366 22.0731 12.3609 22.3745 13.5109 22.4417C14.661 22.5088 15.8127 22.3404 16.8954 21.9466C17.978 21.5528 18.9688 20.9419 19.807 20.1516C20.6452 19.3612 21.3131 18.4079 21.7697 17.3502C22.2263 16.2925 22.462 15.1527 22.4624 14.0007ZM15.1708 9.334C15.1708 9.02458 15.0479 8.72783 14.8291 8.50904C14.6103 8.29025 14.3135 8.16733 14.0041 8.16733C13.6947 8.16733 13.3979 8.29025 13.1792 8.50904C12.9604 8.72783 12.8374 9.02458 12.8374 9.334V15.1673C12.8374 15.4767 12.9604 15.7735 13.1792 15.9923C13.3979 16.2111 13.6947 16.334 14.0041 16.334H17.5041C17.8135 16.334 18.1103 16.2111 18.3291 15.9923C18.5479 15.7735 18.6708 15.4767 18.6708 15.1673C18.6708 14.8579 18.5479 14.5612 18.3291 14.3424C18.1103 14.1236 17.8135 14.0007 17.5041 14.0007H15.1708V9.334Z"
        fill="#DBDCDF"
      />
    </svg>
  )
}