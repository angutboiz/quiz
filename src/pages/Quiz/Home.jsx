import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { fetchBook, get } from "../../utils/request";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { CiTimer } from "react-icons/ci";
import { Tooltip } from "antd";
import { MdOutlineVerified } from "react-icons/md";

export default function Home() {
    const [quiz, setQuiz] = useState([]);

    const db = getFirestore();

    useEffect(() => {
        const fetchBook = async () => {
            const querySnapshot = await getDocs(collection(db, "quiz"));
            const filteredQuiz = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.status === true) {
                    filteredQuiz.push({
                        id: doc.id,
                        data: data,
                    });
                }
            });

            setQuiz(filteredQuiz);
        };
        fetchBook();
    }, []);

    console.log(quiz);
    return (
        <div className=" ">
            <div className="">
                <div className="bg-white p-5">
                    <h1 className="text-xl md:text-2xl text-green-700 font-bold">Chào mừng bạn đến với QuizzEt</h1>
                    <p className="text-sm md:text-md text-gray-500">
                        QuizzEt là trang web giúp bạn tạo ra các bài quiz online một cách dễ dàng và nhanh chóng. Bạn có thể tạo ra các câu hỏi, trả lời và chia sẻ với bạn bè.
                    </p>
                </div>
                <div className="bg-white p-5 mt-2 text-red-500 flex justify-between flex-col md:flex-row gap-3 md:gap-0">
                    <p>Dưới đây là một số quiz từ cộng đồng của chúng tôi</p>
                    <a href="/post">
                        <button className="bg-green-500 text-white">Thêm bài mới</button>
                    </a>
                </div>
                <div className="bg-white p-5 mt-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {quiz?.map((item) => (
                        <NavLink to={`/quiz/${item.id}`} key={item.id}>
                            <div className=" shadow-md border-2 rounded-lg overflow-hidden group">
                                <img src={item.data.img} alt="" className="h-[150px] w-full object-cover" />
                                <div className="p-3">
                                    <div className="flex items-center gap-2 mb-3">
                                        <img src={item.data.image_author} alt="" width={35} height={35} className="rounded-full" />
                                        <div className="">
                                            <div className="flex items-center gap-1">
                                                <h2 className="text-gray-800 text-sm line-clamp-1 w-[142px] overflow-hidden">{item.data.author}</h2>
                                                {!quiz.data?.verify ? (
                                                    <Tooltip title="Tài khoản đã được xác thực">
                                                        <MdOutlineVerified color="#3b82f6" />
                                                    </Tooltip>
                                                ) : (
                                                    "chưa có"
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-[10px] flex gap-1 items-center">
                                                <CiTimer color="#1f2937" /> {item.data.date_post}
                                            </p>
                                        </div>
                                    </div>
                                    <h1 className="text-lg h-[28px] font-bold text-gray-800">{item.data.title}</h1>
                                    <p className="text-gray-700 line-clamp-2 h-[45px] my-3 text-[15px]">{item.data.content}</p>
                                    <div className="text-right">
                                        <button className="bg-green-600 text-white">Làm bài ngay</button>
                                    </div>
                                </div>
                            </div>
                        </NavLink>
                    ))}
                </div>
                <div className=""></div>
            </div>
        </div>
    );
}
