"use client";
import handleCompareDate from "@/lib/CompareDate";
import { GET_API_WITHOUT_COOKIE, POST_API } from "@/lib/fetchAPI";
import { message, Rate, Spin } from "antd";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { CiTimer } from "react-icons/ci";
import { FaFileCircleQuestion, FaRegEye, FaRegFlag } from "react-icons/fa6";
import { IoIosArrowUp } from "react-icons/io";
import { IoArrowForwardCircleOutline, IoShareSocial } from "react-icons/io5";
import { MdKeyboardArrowLeft, MdOutlineVerified } from "react-icons/md";
import Cookies from "js-cookie";
import { RiTimeLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/userContext";
export default function QuizDetail({ params }) {
    const [data, setData] = useState({});
    const [quiz, setQuiz] = useState({});
    const [comment, setComment] = useState({});
    const [value, setValue] = useState(5);
    const [review, setReview] = useState("");
    const token = Cookies.get("token");
    const [messageApi, contextHolder] = message.useMessage();
    const { user } = useUser();
    useEffect(() => {
        const fetchData = async () => {
            const res = await GET_API_WITHOUT_COOKIE(`/quiz/${params.slug}`);
            setComment(res?.quiz?.comment);
            setQuiz(res?.quiz?.questions?.data_quiz.slice(0, 6));
            delete res.quiz?.questions;
            setData(res?.quiz);
        };
        fetchData();
    }, []);
    console.log(comment);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spin size="large" />
            </div>
        );
    }

    const desc = ["Rất tệ", "Tệ", "Tạm ổn", "Tốt", "Rất tốt"];

    const handleSendComment = async () => {
        const newComment = {
            quiz_id: data?._id,
            review,
            rating: value,
            created_at: Date.now,
            user_id: {
                _id: user?._id,
                displayName: user?.displayName,
                profilePicture: user?.profilePicture,
            },
        };
        const req = await POST_API(`/quiz/comment`, newComment, "POST", token);
        const res = await req.json();
        if (req.ok) {
            messageApi.success(res.message);
            setComment([...comment, newComment]);
        } else {
            messageApi.error(res.message);
        }
    };
    const router = useRouter();
    const handlePrev = () => {
        router.back();
    };

    function calAvg(arr) {
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
            sum += arr[i]?.rating;
        }
        return sum / arr.length;
    }
    const [selectedAnswers, setSelectedAnswers] = useState({});

    const handleSelect = (questionId, answerIndex) => {
        setSelectedAnswers({
            ...selectedAnswers,
            [questionId]: answerIndex,
        });
    };
    return (
        <div className="text-third relative px-3 md:px-0">
            {contextHolder}
            <div className=" ">
                <h1 className="flex text-3xl font-bold items-center gap-2">
                    <MdKeyboardArrowLeft onClick={handlePrev} className="hover:text-primary cursor-pointer" />
                    {data?.title}
                </h1>
                <div className="flex flex-col lg:flex-row gap-5 mt-5 bg-white p-5 rounded-lg shadow-sm">
                    <div className="flex-1 flex gap-5">
                        <div className="flex-1 w-[200px] rounded-xl  shadow-md h-[300px] lg:h-[400px]">
                            <div className="overflow-hidden relative h-full rounded-[8px]">
                                <Image
                                    src={data?.img}
                                    alt={data?.title}
                                    className="absolute h-full w-full object-cover hover:scale-110 duration-300  brightness-90"
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    priority
                                />
                                <div className="p-3 absolute z-1 text-white bottom-0 w-full bg-linear-item">
                                    <div className="flex justify-between items-center gap-1 flex-col lg:flex-row">
                                        <Link href={`/profile/${data?.uid?._id}`} className="flex items-center gap-2" alt="">
                                            <div className="relative w-[40px] h-[40px] md:w-[35px] md:h-[35px] rounded-full overflow-hidden">
                                                <Image
                                                    unoptimized
                                                    src={data?.uid?.profilePicture || "/meme.jpg"}
                                                    alt={data?.title}
                                                    className="absolute object-cover h-full"
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    priority
                                                />
                                            </div>
                                            <div className="group">
                                                <div className="flex items-center gap-1">
                                                    <h2 className="text-sm line-clamp-1 overflow-hidden group-hover:underline">{data?.uid?.displayName}</h2>
                                                    {data?.uid?.verify ? <MdOutlineVerified color="#3b82f6" /> : ""}
                                                </div>
                                                {data?.date && (
                                                    <p className="text-[#D9D9D9] text-[10px] flex gap-1 items-center">
                                                        <CiTimer color="#D9D9D9" /> {handleCompareDate(data?.date)}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                        <div className="text-sm">
                                            <div className="flex justify-end items-center gap-1 ">
                                                <FaFileCircleQuestion />
                                                <p className="">Số câu hỏi {data?.questions?.data_quiz.length}</p>
                                            </div>
                                            <div className="flex justify-end items-center gap-1">
                                                <FaRegEye />
                                                <p className="">Lượt làm: {data?.noa}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <div className="">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button className="btn-small !bg-secondary">{data?.subject}</button>
                                    <button className="btn-small !bg-secondary">Xã hội</button>
                                    <button className="btn-small !bg-secondary">Tất cả</button>
                                </div>
                                <div className="flex gap-3 items-center my-3 flex-wrap">
                                    <h1 className="text-3xl font-bold">{Math.round(calAvg(comment) * 10) / 10}</h1>
                                    <div className="">
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <Rate disabled defaultValue={Math.round(calAvg(comment) * 10) / 10} />
                                        </div>
                                        <p>{data?.comment?.length} đánh giá</p>
                                    </div>
                                    <div className="space-y-1">
                                        <FaRegFlag className="hover:text-primary cursor-pointer" />
                                        <IoShareSocial className="hover:text-primary cursor-pointer" />
                                    </div>
                                </div>
                                <div className="">
                                    <p className="italic">{data?.content}</p>
                                </div>
                            </div>
                            <Link href={`/quiz/${data?.slug}`} className="w-[120px] btn btn-primary flex items-center justify-center gap-1">
                                Làm bài <IoArrowForwardCircleOutline />
                            </Link>
                        </div>
                    </div>
                    <div className="flex-1 w-full pr-3">
                        <div className="h-[400px] overflow-y-scroll  space-y-3 ">
                            <h1 className="text-primary font-bold">Preview 10 câu hỏi trong bài quiz này</h1>
                            {quiz.length > 0 &&
                                quiz?.map((item, index) => (
                                    <div className="bg-gray-100 rounded-md px-3 py-2 text-sm" key={index}>
                                        <h1 className="font-bold text-second">{item?.question}</h1>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1 text-gray-500">
                                            {item.answers.map((answer, idx) => (
                                                <div
                                                    key={idx}
                                                    title={answer}
                                                    className={`text-[12px] h-[36px] line-clamp-1 relative flex items-center ${selectedAnswers[item.id] === idx ? " text-primary font-bold" : ""}`}>
                                                    <input
                                                        type="radio"
                                                        name={item.id}
                                                        className="w-1 invisible"
                                                        id={`${index}ans${idx}`}
                                                        checked={selectedAnswers[item.id] === index}
                                                        onChange={() => handleSelect(item.id, idx)}
                                                    />
                                                    <label
                                                        htmlFor={`${index}ans${idx}`}
                                                        className={`absolute  h-full font-bold px-3 flex items-center justify-center rounded-md ${
                                                            selectedAnswers[item.id] === idx ? "bg-primary text-white" : ""
                                                        }`}>
                                                        {idx === 0 ? "A" : idx === 1 ? "B" : idx === 2 ? "C" : "D"}
                                                    </label>
                                                    <label htmlFor={`${index}ans${idx}`} className="block w-full ml-8 p-2 ">
                                                        {answer}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-5">
                <div className="flex gap-5 items-start flex-col-reverse lg:flex-row ">
                    <div className="flex-1 bg-white rounded-lg shadow-sm p-5">
                        <h1 className="text-primary text-3xl font-bold">Đánh giá</h1>
                        <div className="flex gap-5 items-center my-5">
                            <h1 className="text-3xl font-bold">{Math.round(calAvg(comment) * 10) / 10}</h1>
                            <div className="">
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <Rate disabled defaultValue={Math.round(calAvg(comment) * 10) / 10} />
                                </div>
                                <p className="text-gray-500 text-sm mt-1">{data?.comment?.length} đánh giá</p>
                            </div>
                            <div className="space-y-1">
                                <FaRegFlag className="hover:text-primary cursor-pointer" />
                                <IoShareSocial className="hover:text-primary cursor-pointer" />
                            </div>
                        </div>
                        <div className="space-y-3 h-[350px] overflow-y-scroll pr-3">
                            {comment.length > 0 &&
                                comment?.map((item, index) => (
                                    <div className="bg-gray-100 rounded-lg shadow-sm px-5 py-3" key={index}>
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-[40px] h-[40px] md:w-[35px] md:h-[35px] rounded-full overflow-hidden">
                                                <Image
                                                    src={item?.user_id?.profilePicture || "/meme.jpg"}
                                                    alt=""
                                                    className="absolute object-cover h-full"
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            </div>
                                            <div className="flex-1 flex gap-10 items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-bold line-clamp-1">{item.user_id?.displayName || "N/A"}</h3>
                                                    {item?.created_at && (
                                                        <p className="text-gray-500 text-sm flex gap-1 items-center">
                                                            <RiTimeLine /> {handleCompareDate(item?.created_at)}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex justify-end items-center gap-1 text-yellow-500">
                                                    <Rate disabled defaultValue={item?.rating} />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="mt-2">{item?.review}</p>
                                    </div>
                                ))}
                            {comment.length === 0 && <p className="text-gray-500">Chưa có lượt đánh giá nào...</p>}
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-lg shadow-sm p-5 space-y-2">
                        <h1 className="text-secondary text-3xl font-bold">Bình luận</h1>
                        <p className="text-gray-500">Hãy để lại bình luận cũng như số sao của bạn dưới đây:</p>
                        <Rate defaultValue={5} tooltips={desc} onChange={setValue} value={value} />
                        <textarea placeholder="Bình luận của bạn..." className="h-[100px] rounded-xl py-3" value={review} onChange={(e) => setReview(e.target.value)}></textarea>
                        <button className="btn btn-primary w-[100px]" onClick={handleSendComment}>
                            Gửi
                        </button>
                    </div>
                </div>
            </div>
            <div
                className="fixed bottom-10 right-10 flex items-center justify-center rounded-full bg-primary text-white cursor-pointer w-[40px] h-[40px] animate-bounce"
                onClick={() => window.scrollTo(0, 0)}>
                <IoIosArrowUp />
            </div>
        </div>
    );
}
