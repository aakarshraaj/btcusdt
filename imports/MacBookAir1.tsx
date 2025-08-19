import imgImage4 from "figma:asset/b677493a658804fca9130f1fb542d6dd228c1fed.png";

function Frame4() {
  return (
    <div className="bg-[#dedede] box-border content-stretch flex gap-1 items-center justify-center p-[8px] relative rounded-lg shrink-0">
      <div
        className="bg-center bg-cover bg-no-repeat shrink-0 size-6"
        data-name="image 4"
        style={{ backgroundImage: `url('${imgImage4}')` }}
      />
      <div className="font-['Space_Grotesk:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#000000] text-[24px] text-nowrap">
        <p className="block leading-[normal] whitespace-pre">$</p>
      </div>
    </div>
  );
}

function Frame8() {
  return (
    <div className="bg-[#dedede] box-border content-stretch flex gap-2.5 items-center justify-center p-[24px] relative rounded-2xl shrink-0">
      <div className="font-['Space_Grotesk:Bold',_sans-serif] font-bold leading-[0] relative shrink-0 text-[#000000] text-[96px] text-nowrap">
        <p className="block leading-[normal] whitespace-pre">115</p>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-[#dedede] box-border content-stretch flex gap-2.5 items-center justify-center p-[24px] relative rounded-2xl shrink-0">
      <div className="font-['Space_Grotesk:Bold',_sans-serif] font-bold leading-[0] relative shrink-0 text-[#000000] text-[96px] text-nowrap">
        <p className="block leading-[normal] whitespace-pre">055</p>
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="bg-[#dedede] box-border content-stretch flex gap-2.5 items-center justify-center p-[24px] relative rounded-2xl shrink-0">
      <div className="font-['Space_Grotesk:Bold',_sans-serif] font-bold leading-[0] relative shrink-0 text-[#000000] text-[96px] text-nowrap">
        <p className="block leading-[normal] whitespace-pre">.31</p>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="box-border content-stretch flex gap-2 items-start justify-start p-0 relative shrink-0 w-full">
      <Frame4 />
      <Frame8 />
      <Frame5 />
      <Frame6 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="box-border content-stretch flex flex-col gap-3.5 items-start justify-start p-0 relative shrink-0">
      <div className="font-['Space_Grotesk:Bold',_sans-serif] font-bold leading-[0] relative shrink-0 text-[#000000] text-[24px] w-full">
        <p className="block leading-[normal]">Current Price (USD)</p>
      </div>
      <Frame7 />
    </div>
  );
}

export default function MacBookAir1() {
  return (
    <div className="bg-[#ffffff] relative size-full" data-name="MacBook Air - 1">
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2.5 items-center justify-center px-[461px] py-[341px] relative size-full">
          <Frame9 />
        </div>
      </div>
    </div>
  );
}