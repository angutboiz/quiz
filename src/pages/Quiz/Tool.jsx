import { getFirestore } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { get_firebase } from "../../utils/request";
import sortArrayByTime from "../../helpers/sort";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
export default function Tool() {
    const [data, setdata] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const db = getFirestore();
    useEffect(() => {
        const fetchTool = async () => {
            const fetchTopic = await get_firebase(db, "tool");
            const result = sortArrayByTime(fetchTopic);
            setdata(result);
            setIsLoading(false);
        };
        fetchTool();
    }, []);
    return (
        <div className="">
            {isLoading ? (
                <div className="h-[400px] flex items-center justify-center w-full">
                    <Spin indicator={<LoadingOutlined spin />} size="large" />
                </div>
            ) : (
                <div className="bg-white p-5 mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 lg:grid-cols-3 gap-4">
                    {data.map((item, index) => (
                        <NavLink to={`/tool/${item.name}`} className="relative" key={index}>
                            <div className=" shadow-md border-2 rounded-lg overflow-hidden group">
                                <img src={item.image} alt="" className="h-[150px] w-full object-cover" />
                                <div className="p-3">
                                    <h1 className="text-lg text-green-500 font-bold h-[56px]">{item.title}</h1>
                                    <p className="text-gray-500 line-clamp-2 h-[48px] my-1">{item.description}</p>
                                    <div className="text-right flex items-center justify-between ">
                                        <p className="">
                                            Tổng câu hỏi: <label className="text-red-500 font-bold">{item.quest?.length}</label>{" "}
                                        </p>
                                        <button className="bg-green-500 text-white">Xem ngay</button>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 left-0">
                                <p className="text-green-500 bg-green-200 p-2 rounded-lg text-sm font-bold">{item.date}</p>
                            </div>
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
}
