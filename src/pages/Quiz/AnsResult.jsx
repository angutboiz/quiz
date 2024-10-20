import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Progress } from "antd";
import { get_api } from "../../services/fetchapi";
export default function Answer() {
    const [quiz, setQuiz] = useState([]);
    const [loading, setLoading] = useState(false);

    const params = useParams();

    useEffect(() => {
        const fetchAPI = async () => {
            const req = await get_api("/history/" + params.id);
            setQuiz(req.history);
            setLoading(true);
        };
        fetchAPI();
    }, [params.id]);

    return (
        <>
            {loading ? (
                <div>
                    <div className="flex justify-between flex-col md:flex-row gap-5 md:gap-0">
                        <div className="">
                            <h1 className="text-xl font-bold text-green-500">Bài quiz về chủ đê: {quiz.title}</h1>
                            <p className="text-gray-600" key={quiz.id}>
                                Nội dung: {quiz.content}
                            </p>
                            <p>
                                Tổng số câu: {quiz.score}/{quiz.questions?.data_history.length} câu
                            </p>
                        </div>
                        <div className="flex gap-5 text-center justify-center">
                            <div className="">
                                <Progress type="circle" percent={quiz.questions?.data_history.length - quiz.score} status="exception" />
                                <p className="text-gray-600 mt-1">Câu sai: {quiz.questions?.data_history.length - quiz.score}</p>
                            </div>

                            <div className="">
                                <Progress type="circle" percent={Math.floor((quiz.score / quiz.questions?.data_history.length) * 100)} />
                                <p className="text-gray-600 mt-1">Tỉ lệ đúng</p>
                            </div>
                        </div>
                    </div>

                    <div className="md:w-[1000px] w-full">
                        {quiz.questions?.data_history.map((item, index) => (
                            <div className="bg-white p-5 mt-5 shadow-sm border-[1px]" key={item.id}>
                                <h1 className={` ${item.answer_correct === item.answer_choose ? "text-green-500 " : "text-red-500"}   mb-3 flex gap-2 items-center`}>
                                    <p className="text-lg font-bold">
                                        Câu {index + 1}: {item.question_name}
                                    </p>
                                    {item.answer_correct === item.answer_choose ? <p className="text-green-500 bg-green-100 px-3">Đúng</p> : <p className="text-red-500 bg-red-100 px-3">Sai</p>}
                                </h1>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {item.answers?.map((answer, ansIndex) => (
                                        <div
                                            key={ansIndex}
                                            className={`border relative  flex items-center  ${item.answer_correct === ansIndex ? "!bg-green-100 text-green-500 font-bold" : ""} ${
                                                item.answer_choose === ansIndex ? "bg-red-100 " : ""
                                            }`}>
                                            <input type="radio" name={item.id} className="w-1 invisible" disabled id={`${item.id}ans${ansIndex}`} defaultChecked={item.answer_correct === ansIndex} />
                                            <label
                                                htmlFor={`${item.id}ans${ansIndex}`}
                                                className={`absolute  h-full font-bold p-3 flex items-center justify-center   ${item.answer_correct === ansIndex ? "!bg-green-400 !text-white" : ""} ${
                                                    item.answer_choose === ansIndex ? "bg-red-500 text-white" : " "
                                                }`}>
                                                {ansIndex === 0 ? "A" : ansIndex === 1 ? "B" : ansIndex === 2 ? "C" : "D"}
                                            </label>
                                            <label htmlFor={`${item.id}ans${ansIndex}`} className="block w-full ml-7 p-3">
                                                {answer}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div>Loading...</div>
            )}
        </>
    );
}
