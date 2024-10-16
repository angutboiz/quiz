import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";
import { MdOutlineVerified } from "react-icons/md";
import Swal from "sweetalert2";
import { Tooltip, Avatar, Button } from "antd";
import { CiTimer } from "react-icons/ci";
import { FaEye } from "react-icons/fa";
import { get_api, post_api } from "../../services/fetchapi";
import handleCompareDate from "../../utils/compareData";
import { FaFacebookMessenger } from "react-icons/fa6";
import { useSelector } from "react-redux";

export default function ProfileUID() {
    const [profile, setProfile] = useState({});
    const [quiz, setQuiz] = useState([]);

    const params = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAPI = async () => {
            const req = await get_api(`/profile/${params.uid}`);
            setProfile(req.user);
            setQuiz(req.quiz);
        };

        fetchAPI();
    }, []);
    const user = useSelector((state) => state.user);

    const handleCreateAndCheckRoomChat = async (id_another_user) => {
        const req = await get_api(`/chat/check/${id_another_user}`);
        if (req.ok && req.exists) {
            // Phòng chat đã tồn tại, điều hướng đến phòng chat
            navigate(`/chat/room/${req.chatId}`);
        } else if (req.ok && !req.exists) {
            // Phòng chat chưa tồn tại, tạo mới
            const createReq = await post_api(
                "/chat/create-chat",
                {
                    participants: [user._id, id_another_user],
                },
                "POST"
            );
            const reqData = await createReq.json();
            if (reqData.ok) {
                navigate(`/chat/room/${reqData.chat}`);
            } else {
                console.log(reqData.message);
            }
        } else {
            console.log(req.message);
        }
    };

    return (
        <div>
            {profile ? (
                <>
                    <div className="flex gap-3 items-center">
                        <div className="w-[100px] h-[100px] rounded-full overflow-hidden ">
                            <img src={profile.profilePicture} alt="" className="object-cover h-full" />
                        </div>
                        <div className="">
                            <div className="flex gap-2 items-center">
                                <h1 className="text-2xl font-bold text-gray-700">{profile.displayName || profile.email}</h1>
                                {profile.emailVerified ? (
                                    <Tooltip title="Tài khoản đã được xác thực">
                                        <MdOutlineVerified color="#3b82f6" />
                                    </Tooltip>
                                ) : (
                                    ""
                                )}
                            </div>
                        </div>
                    </div>
                    <Button onClick={() => handleCreateAndCheckRoomChat(params.uid)} className="w-[100px] flex gap-1 items-center mt-2">
                        <FaFacebookMessenger />
                        Nhắn tin
                    </Button>

                    <hr className="my-5" />
                    <div className="">
                        <h1 className="text-lg font-bold text-green-500" key={profile._id}>
                            Các bài đăng của {profile.displayName || profile.email}
                        </h1>
                        <div className="bg-white p-5 mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {quiz && quiz.length === 0 ? (
                                <div>
                                    <p>Người này chưa có đăng bài nào</p>
                                </div>
                            ) : (
                                ""
                            )}
                            {quiz &&
                                quiz?.map((item) => (
                                    <div key={item.id} className="relative">
                                        <div className="shadow-md border-2 rounded-lg overflow-hidden group ">
                                            <img src={item.img} alt="" className="h-[150px] w-full object-cover" />
                                            <div className="p-3">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-[40px] h-[40px] md:w-[35px] md:h-[35px] rounded-full overflow-hidden">
                                                        <img src={profile.profilePicture} alt="" className="object-cover h-full" />
                                                    </div>
                                                    <div className="">
                                                        <div className="flex items-center gap-1">
                                                            <h2 className="text-gray-800 text-sm line-clamp-1 overflow-hidden">{profile.displayName}</h2>
                                                            {profile.verify ? (
                                                                <Tooltip title="Tài khoản đã được xác thực">
                                                                    <MdOutlineVerified color="#3b82f6" />
                                                                </Tooltip>
                                                            ) : (
                                                                ""
                                                            )}
                                                        </div>
                                                        <p className="text-gray-400 text-[10px] flex gap-1 items-center">
                                                            <CiTimer color="#1f2937" /> {handleCompareDate(item.date)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <h1 className="text-lg h-[56px] font-bold text-gray-800">{item.title}</h1>
                                                <p className="text-gray-700 line-clamp-2 h-[45px] my-3 text-[15px]">{item.content}</p>
                                                <NavLink to={`/quiz/${item.slug}`} className="text-right">
                                                    {item.status ? <Button className="bg-green-600 text-white">Làm bài ngay</Button> : <Button className="bg-gray-200 text-black">Xem lại bài</Button>}
                                                </NavLink>
                                            </div>
                                        </div>

                                        {!item.status ? (
                                            <div className="absolute top-0 left-0 right-0 bottom-0 z-10 opacity-80">
                                                <div className="bg-gray-100 text-center text-red-700 text-2xl font-bold h-full flex items-center justify-center flex-col">
                                                    <p>Đang kiểm duyệt</p>
                                                    <NavLink to={`/quiz/${item.id}`} className="text-right">
                                                        <Button className="mt-3 text-red-700 font-bold flex gap-1 items-center">
                                                            {" "}
                                                            <FaEye />
                                                            Xem lại bài
                                                        </Button>
                                                    </NavLink>
                                                </div>
                                            </div>
                                        ) : (
                                            ""
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <h1>Người này không tồn tại</h1>
                </>
            )}
        </div>
    );
}
