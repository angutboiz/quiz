"use client";
import { GET_API, POST_API } from "@/lib/fetchAPI";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { GiStopSign } from "react-icons/gi";
import { CiShuffle } from "react-icons/ci";
import { message, Modal, Popconfirm, Popover, Spin, Switch } from "antd";
import { FaBrain, FaTrash } from "react-icons/fa6";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LoadingOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { IoIosArrowBack, IoMdAdd } from "react-icons/io";
import { MdEdit, MdOutlineQuestionMark } from "react-icons/md";
import { useRouter } from "next/navigation";
import Link from "next/link";
import handleCompareDate from "@/lib/CompareDate";
import { IoClose } from "react-icons/io5";
import { TiEdit } from "react-icons/ti";
import { useUser } from "@/context/userContext";
import Image from "next/image";
export default function FlashCardDetail({ params }) {
    const [open, setOpen] = useState(false);
    const [setOpenConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingConfirm, setLoadingConfirm] = useState(false);
    const [loadingAudio, setLoadingAudio] = useState(null);
    const [flashcard, setFlashcard] = useState([]);
    const [isSimple, setIsSimple] = useState(1); // 1: từ chi tiết, 2 đơn giản
    const defaultFlashcard = { _id: "", title: "", define: "", type_of_word: "", transcription: "", example: [], note: "" };
    const [newFlashcard, setNewFlashcard] = useState(defaultFlashcard);
    const token = Cookies.get("token");
    const [messageApi, contextHolder] = message.useMessage();
    const router = useRouter();
    useEffect(() => {
        const fetchFlashCard = async () => {
            setLoading(true);
            const req = await GET_API(`/flashcards/${params?.slug}`, token);
            if (req.ok) {
                const sortedFlashcards = sortFlashcards(req?.listFlashCards?.flashcards);
                setFlashcard({ ...req.listFlashCards, flashcards: sortedFlashcards });
                setNewListFlashCard({ title: req.listFlashCards.title, language: req.listFlashCards.language, desc: req.listFlashCards.desc, public: req.listFlashCards.public });
            } else {
                messageApi.open({
                    type: "error",
                    content: req.message,
                });
            }
            setLoading(false);
        };
        fetchFlashCard();
    }, []);

    const sortFlashcards = (flashcards) => {
        return flashcards.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        });
    };

    // showw modal thêm mới từ trong flashcard
    const showModal = () => {
        setOpen(true);
    };

    const handleOk = async () => {
        setLoading(true);
        const req = await POST_API("/flashcards", { ...newFlashcard, list_flashcard_id: flashcard._id }, "POST", token);
        const res = await req.json();
        if (req.ok) {
            setOpen(false);
            setFlashcard((prev) => ({ ...prev, flashcards: [res.flashcard, ...prev.flashcards] }));
            setNewFlashcard(defaultFlashcard);
        } else {
            messageApi.open({
                type: "error",
                content: res.message,
            });
        }
        setLoading(false);
    };

    const handleCancel = () => {
        setOpen(false);
    };

    const genAI = new GoogleGenerativeAI(process.env.API_KEY_AI);

    const handleSendPrompt = async (method) => {
        setLoading(true);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const word = method === 1 ? editWord.title : newFlashcard.title;
        const optimizedPrompt = `
                Bạn là một chuyên gia ngôn ngữ có khả năng tạo flashcard chất lượng cao. Hãy tạo flashcard cho từ "${word}" với ngôn ngữ ${flashcard?.language}.
                
                Yêu cầu:
                1. Phải cung cấp thông tin chính xác và đầy đủ
                2. Ví dụ phải thực tế và dễ hiểu
                3. Ghi chú phải hữu ích cho việc ghi nhớ
                4. Định dạng JSON phải chính xác
                
                Trả về kết quả theo cấu trúc JSON sau và KHÔNG kèm theo bất kỳ giải thích nào:
                
                {
                "title": "", // Từ gốc bằng ${flashcard?.language}
                "define": "", // Định nghĩa bằng tiếng Việt, ngắn gọn và dễ hiểu
                "type_of_word": "", // Loại từ (danh từ, động từ, tính từ, etc.)
                "transcription": "", // Phiên âm chuẩn IPA
                "example": [
                    {
                    "en": "", // Câu ví dụ bằng ${flashcard?.language}
                    "vi": ""  // Dịch nghĩa tiếng Việt
                    },
                    {
                    "en": "",
                    "vi": ""
                    },
                    {
                    "en": "",
                    "vi": ""
                    },
                    {
                    "en": "",
                    "vi": ""
                    }
                ],
                "note": "" // Tips ghi nhớ, cách dùng đặc biệt, hoặc các lưu ý quan trọng bằng tiếng Việt. Các dấu nháy đôi "" thay bằng dấu ngoặc () để tránh lỗi JSON
                }
                `;
        const result = await model.generateContent(optimizedPrompt);
        const parse = result.response
            .text()
            .replace(/```json/g, "")
            .replace(/```/g, "");
        console.log(parse);
        if (method === 1) {
            setEditWord({ ...editWord, ...JSON.parse(parse) });
        } else {
            setNewFlashcard(JSON.parse(parse));
        }

        setLoading(false);
    };

    const speakWord = async (text, type, id) => {
        setLoadingAudio(id);
        if (flashcard?.language == "english") {
            const req = await fetch(`${process.env.API_ENDPOINT}/proxy?audio=${text}&type=${type}`);
            const blob = await req.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
        } else {
            if ("speechSynthesis" in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                if (flashcard?.language == "japan") utterance.lang = "ja-JP"; // Thiết lập ngôn ngữ tiếng Nhật
                if (flashcard?.language == "korea") utterance.lang = "ko-KR"; // Thiết lập ngôn ngữ tiếng Hàn
                if (flashcard?.language == "chinese") utterance.lang = "zh-CN"; // Thiết lập ngôn ngữ tiếng Trung
                window.speechSynthesis.speak(utterance);
            } else {
                alert("Trình duyệt của bạn không hỗ trợ Text-to-Speech.");
            }
        }
        setLoadingAudio(null);
    };

    const showPopconfirm = () => {
        setOpenConfirm(true);
    };

    const confirm = async () => {
        setLoading(true);
        const req = await POST_API(`/list-flashcards/${flashcard._id}`, {}, "DELETE", token);
        const res = await req.json();
        if (res.ok) {
            messageApi.open({
                type: "success",
                content: res.message,
            });
            router.push("/flashcard");
        } else {
            messageApi.open({
                type: "error",
                content: res.message,
            });
        }
        setOpenConfirm(false);
        setLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
            // Kiểm tra tổ hợp phím Ctrl + Enter
            handleOk();
        } else if (e.key === "Enter") {
            handleSendPrompt();
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };
    // dùng cho eidt từ trong flashcard
    const handleKeyPressEdit = (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
            // Kiểm tra tổ hợp phím Ctrl + Enter
            handleOkEditWord();
        } else if (e.key === "Enter") {
            handleSendPrompt(1);
        } else if (e.key === "Escape") {
            setOpenEditWord(false);
        }
    };

    const [openTrick, setOpenTrick] = useState(false);

    const handleOpenChangeTrick = (newOpen) => {
        setOpenTrick(newOpen);
    };

    // chỉnh sửa list flashcard
    const [openEdit, setOpenEdit] = useState(false);
    const [newListFlashCard, setNewListFlashCard] = useState({});

    const showModalEdit = () => {
        setOpenEdit(true);
    };

    const handleOkEdit = async () => {
        setLoading(true);
        const req = await POST_API("/list-flashcards/" + params?.slug, newListFlashCard, "PUT", token);
        const res = await req.json();
        if (req.ok) {
            setOpenEdit(false);
            // setListFlashCard([...listFlashCard, res.listFlashCard]);
            flashcard.title = newListFlashCard.title;
            flashcard.language = newListFlashCard.language;
            flashcard.desc = newListFlashCard.desc;
            flashcard.public = newListFlashCard.public;
        } else {
            messageApi.open({
                type: "error",
                content: res.message,
            });
        }
        setLoading(false);
    };

    const handleCancelEdit = () => {
        setOpenEdit(false);
    };

    const confirmDelete = async (id) => {
        setLoadingConfirm(true);
        const req = await POST_API(`/flashcards/${id}`, {}, "DELETE", token);
        const res = await req.json();
        if (req.ok) {
            setFlashcard((prev) => ({ ...prev, flashcards: prev.flashcards.filter((item) => item._id !== id) }));
            messageApi.open({
                type: "success",
                content: res.message,
            });
        } else {
            messageApi.open({
                type: "error",
                content: res.message,
            });
        }
        setLoadingConfirm(false);
    };
    // cập nhật từ trong flashcard
    const [openEditWord, setOpenEditWord] = useState(null);
    const [editWord, setEditWord] = useState({});

    const handleEditWord = (item) => {
        setEditWord(item);
        showModalEditWord(item._id);
    };

    const showModalEditWord = (id) => {
        setOpenEditWord(id);
    };

    const handleOkEditWord = async () => {
        setLoadingConfirm(true);
        const req = await POST_API("/flashcards/" + editWord._id, editWord, "PUT", token);
        const res = await req.json();
        if (req.ok) {
            setOpenEditWord(false);
            setFlashcard((prev) => ({
                ...prev,
                flashcards: prev.flashcards.map((flashcard) => (flashcard._id === res.flashcard._id ? res.flashcard : flashcard)),
            }));
            setEditWord(defaultFlashcard);
            handleCancelEditWord();
        } else {
            messageApi.open({
                type: "error",
                content: res.message,
            });
        }
        setLoadingConfirm(false);
    };

    const handleCancelEditWord = () => {
        setOpenEditWord(null);
    };

    const { user } = useUser();

    if (!flashcard) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spin size="large" />
            </div>
        );
    }
    return (
        <div className="text-third px-3 md:px-0">
            {contextHolder}
            <Link href="/flashcard" className="hover:text-primary hover:underline flex items-center gap-1">
                <IoIosArrowBack /> Quay lại
            </Link>
            <div className="flex items-center gap-2 md:gap-5 md:flex-row flex-col">
                <h1 className="text-2xl font-bold text-primary">Flashcard: {flashcard?.title}</h1>
                {user?._id == flashcard?.userId?._id ? (
                    <div className="flex-1 flex justify-between gap-2 items-center">
                        <div className="flex gap-2 items-center">
                            <button className="btn btn-primary flex items-center gap-1" onClick={showModalEdit}>
                                <MdEdit /> Chỉnh sửa
                            </button>
                            <button className="btn btn-primary flex items-center gap-1" onClick={showModal}>
                                <IoMdAdd /> Thêm từ mới
                            </button>
                        </div>
                        <div className="">
                            <Popconfirm
                                title="Xóa flashcard này?"
                                description="Bạn chắc chứ? nó sẽ không khôi phục được đâu"
                                onConfirm={confirm}
                                okText="Chắc chắn!"
                                cancelText="Để suy nghĩ lại"
                                okButtonProps={{
                                    loading: loading,
                                }}>
                                <button disabled={user?._id == flashcard?.userId} className="btn btn-primary !bg-red-500 flex items-center gap-1" onClick={showPopconfirm}>
                                    <FaTrash /> Xóa
                                </button>
                            </Popconfirm>
                        </div>
                    </div>
                ) : (
                    ""
                )}
                {/* chỉnh sửa list flashcard*/}
                <Modal title="Chỉnh sửa list từ" open={openEdit} onOk={handleOkEdit} confirmLoading={loading} okText="Chỉnh sửa" onCancel={handleCancelEdit}>
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Tên list từ"
                            className="w-full p-3 border rounded-md"
                            value={newListFlashCard?.title}
                            onChange={(e) => setNewListFlashCard({ ...newListFlashCard, title: e.target.value })}
                        />
                        <select name="" id="" value={newListFlashCard?.language} onChange={(e) => setNewListFlashCard({ ...newListFlashCard, language: e.target.value })}>
                            <option value="english">Tiếng Anh-Mỹ</option>
                            <option value="chinese">Tiếng Trung</option>
                            <option value="korea">Tiếng Hàn</option>
                            <option value="japan">Tiếng Nhật</option>
                        </select>

                        <textarea
                            placeholder="Mô tả"
                            className="w-full p-3 border rounded-md"
                            value={newListFlashCard?.desc}
                            onChange={(e) => setNewListFlashCard({ ...newListFlashCard, desc: e.target.value })}
                        />
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                className="w-5"
                                id="public"
                                checked={newListFlashCard?.public}
                                onChange={(e) => setNewListFlashCard({ ...newListFlashCard, public: e.target.checked })}
                            />
                            <label htmlFor="public" className="cursor-pointer">
                                Công khai
                            </label>
                        </div>
                    </div>
                </Modal>
                {/* thêm từ mới */}
                <Modal title="Thêm từ mới" open={open} onOk={handleOk} confirmLoading={loading} okText="Tạo" onCancel={handleCancel}>
                    <div className="space-y-3">
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <div className="flex gap-2 items-center">
                                    <p className="ml-2">Tên từ mới (nhập rồi bấm vào AI Generate)</p>
                                    <Popover
                                        content={
                                            <div>
                                                <p>Bấm Enter để AI Generate</p>
                                                <p>Bấm Ctrl + Enter để tạo</p>
                                            </div>
                                        }
                                        title="Mẹo nhỏ"
                                        trigger="click"
                                        open={openTrick}
                                        onOpenChange={handleOpenChangeTrick}>
                                        <MdOutlineQuestionMark className="text-red-500" />
                                    </Popover>
                                </div>
                                <input
                                    type="text"
                                    className=""
                                    placeholder="Tên từ mới "
                                    value={newFlashcard?.title}
                                    onChange={(e) => setNewFlashcard({ ...newFlashcard, title: e.target.value })}
                                    onKeyDown={handleKeyPress}
                                />
                            </div>
                            <button className="btn btn-primary flex items-center gap-2 " onClick={handleSendPrompt}>
                                {loading ? <Spin indicator={<LoadingOutlined spin />} size="small" style={{ color: "blue" }} /> : <FaBrain />}
                                AI Generate
                            </button>
                        </div>
                        <div className="">
                            <p className="ml-2">Định nghĩa</p>
                            <input placeholder="Định nghĩa  (bắt buộc)" value={newFlashcard?.define} onChange={(e) => setNewFlashcard({ ...newFlashcard, define: e.target.value })} />
                        </div>
                        <div className="border border-secondary  p-2 rounded-md space-y-2">
                            <p className="text-gray-700">Không yêu cầu phải điền</p>
                            <div className="flex gap-3 items-center">
                                <div className="flex-1">
                                    <p className="ml-2">Loại từ</p>
                                    <input
                                        type="text"
                                        placeholder="Loại từ (N,V,Adj,...)"
                                        value={newFlashcard?.type_of_word}
                                        onChange={(e) => setNewFlashcard({ ...newFlashcard, type_of_word: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="ml-2">Phiên âm</p>
                                    <input
                                        type="text"
                                        placeholder="Phiên âm"
                                        value={newFlashcard?.transcription}
                                        onChange={(e) => setNewFlashcard({ ...newFlashcard, transcription: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="">
                                <p className="ml-2">Ví dụ</p>
                                <textarea
                                    placeholder="Ví dụ (tối đa 10 câu)"
                                    className="h-32"
                                    value={newFlashcard?.example?.map((ex) => `EN: ${ex.en}\nVI: ${ex.vi}`).join("\n\n")}
                                    onChange={(e) => {
                                        const updatedExamples = e.target.value.split("\n\n").map((sentence) => {
                                            const [en, vi] = sentence.split("\n").map((line) => line.replace(/^EN: |^VI: /, "").trim());
                                            return { en, vi };
                                        });
                                        setNewFlashCard({ ...newFlashcard, example: updatedExamples });
                                    }}
                                />
                            </div>
                            <div className="">
                                <p className="ml-2">Ghi chú</p>
                                <textarea className="h-20" placeholder="Ghi chú" value={newFlashcard.note} onChange={(e) => setNewFlashCard({ ...newFlashcard, note: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>

            <p className="text-gray-500 italic">{flashcard?.desc || "Không có mô tả"}</p>
            <p className="text-gray-500 italic">Ngôn ngữ: {flashcard?.language} (bấm vào chỉnh sửa để sửa tiếng phát)</p>
            <div className="flex items-center gap-2 mt-2">
                <p>Người chia sẻ:</p>
                <div className="w-[40px] h-[40px] overflow-hidden relative">
                    <Image src={flashcard?.userId?.profilePicture || "/meme.jpg"} alt="" className="rounded-full w-full h-full absolute object-cover" fill />
                </div>
                <Link href={`/profile/${flashcard?.userId?._id}`} className="hover:underline">
                    <p title={flashcard?.userId?.displayName} className="line-clamp-1">
                        {flashcard?.userId?.displayName}
                    </p>
                </Link>
            </div>
            <Link href={`/flashcard/practice/${flashcard?._id}`} className="py-5 block">
                <button className="w-full btn btn-primary">Luyện tập Flashcards</button>
            </Link>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-secondary">
                    <CiShuffle />
                    <p>Xem ngẫu nhiên</p>
                </div>
                <div className="flex items-center gap-1 text-red-500">
                    <GiStopSign />
                    <p>Dừng học</p>
                </div>
            </div>
            <div className="h-[100px] bg-gray-100 border shadow-md rounded-md flex my-5">
                <div className="flex-1 flex items-center justify-center flex-col">
                    <h1 className="text-primary font-bold text-2xl">0</h1>
                    <p className="text-gray-500">Đã học</p>
                </div>
                <div className="flex-1 flex items-center justify-center flex-col">
                    <h1 className="text-primary font-bold text-2xl">0</h1>
                    <p className="text-gray-500">Đã nhớ</p>
                </div>
                <div className="flex-1 flex items-center justify-center flex-col">
                    <h1 className="text-red-500 font-bold text-2xl">0</h1>
                    <p className="text-gray-500">Cần ôn tập</p>
                </div>
            </div>
            <div className="">
                <div className="flex gap-3 items-center">
                    <h3>List có {flashcard?.flashcards?.length} từ</h3>

                    <Switch
                        checkedChildren={isSimple === 1 && "Chi tiết "}
                        unCheckedChildren={isSimple === 2 && "Đơn giản"}
                        checked={isSimple === 1}
                        onChange={(checked) => setIsSimple(checked ? 1 : 2)}
                    />
                </div>
                {isSimple === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5 ">
                        {flashcard?.flashcards?.map((item, index) => (
                            <div className="bg-gray-100 p-5 shadow-sm rounded-xl" key={index}>
                                <div className="flex items-center justify-between gap-5">
                                    <div className="flex gap-2 items-center text-secondary font-bold flex-wrap">
                                        <h1 className="text-primary text-lg" title={item?.title}>
                                            {item?.title}
                                        </h1>

                                        <p>{item?.transcription}</p>
                                        {flashcard?.language == "english" ? (
                                            <>
                                                <div className="flex items-center gap-1 mr-2 cursor-pointer" onClick={() => speakWord(item?.title, 1, item?._id)}>
                                                    {loadingAudio == item?._id ? <Spin indicator={<LoadingOutlined spin />} size="small" style={{ color: "blue" }} /> : <HiMiniSpeakerWave />}
                                                    <p>US</p>
                                                </div>
                                                <div className="flex items-center gap-1 cursor-pointer" onClick={() => speakWord(item?.title, 2, item?._id)}>
                                                    {loadingAudio == item?._id ? <Spin indicator={<LoadingOutlined spin />} size="small" style={{ color: "blue" }} /> : <HiMiniSpeakerWave />}
                                                    UK
                                                </div>
                                            </>
                                        ) : (
                                            <HiMiniSpeakerWave className="flex items-center gap-1 cursor-pointer" onClick={() => speakWord(item?.title, 2, item?._id)} />
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <TiEdit className="hover:text-primary cursor-pointer" onClick={() => handleEditWord(item)} />
                                        <Popconfirm
                                            title={`Xóa từ "${item?.title}"`}
                                            description="Bạn có chắc muốn xóa từ này không?"
                                            okText="Chắc chắn"
                                            onConfirm={() => confirmDelete(item._id)}
                                            okButtonProps={{
                                                loading: loadingConfirm,
                                            }}
                                            cancelText="Để suy nghĩ lại"
                                            icon={
                                                <QuestionCircleOutlined
                                                    style={{
                                                        color: "red",
                                                    }}
                                                />
                                            }>
                                            <IoClose className="hover:text-red-500 cursor-pointer" />
                                        </Popconfirm>
                                    </div>
                                    {/* model chỉnh sửa từ */}
                                    <Modal
                                        title="Chỉnh sửa từ"
                                        open={openEditWord == item?._id}
                                        onOk={handleOkEditWord}
                                        confirmLoading={loadingConfirm}
                                        cancelText="Hủy bỏ"
                                        okText="Chỉnh sửa"
                                        onCancel={handleCancelEditWord}>
                                        <div className="space-y-3">
                                            <div className="flex gap-3 items-end">
                                                <div className="flex-1">
                                                    <div className="flex gap-2 items-center">
                                                        <p className="ml-2">Tên từ (nhập rồi bấm vào AI Generate)</p>
                                                        <Popover
                                                            content={
                                                                <div>
                                                                    <p>Bấm Enter để AI Generate</p>
                                                                    <p>Bấm Ctrl + Enter để tạo</p>
                                                                </div>
                                                            }
                                                            title="Mẹo nhỏ"
                                                            trigger="click"
                                                            open={openTrick}
                                                            onOpenChange={handleOpenChangeTrick}>
                                                            <MdOutlineQuestionMark className="text-red-500" />
                                                        </Popover>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className=""
                                                        placeholder="Tên từ mới "
                                                        value={editWord.title}
                                                        onChange={(e) => setEditWord({ ...editWord, title: e.target.value })}
                                                        onKeyDown={handleKeyPressEdit}
                                                    />
                                                </div>
                                                <button className="btn btn-primary flex items-center gap-2" onClick={() => handleSendPrompt(1)}>
                                                    {loading ? <Spin indicator={<LoadingOutlined spin />} size="small" style={{ color: "white" }} /> : <FaBrain />}
                                                    AI Generate
                                                </button>
                                            </div>
                                            <div className="">
                                                <p className="ml-2">Định nghĩa</p>
                                                <input placeholder="Định nghĩa  (bắt buộc)" value={editWord.define} onChange={(e) => setEditWord({ ...editWord, define: e.target.value })} />
                                            </div>
                                            <div className="border border-secondary  p-2 rounded-md space-y-2">
                                                <p className="text-gray-700">Không yêu cầu phải điền</p>
                                                <div className="flex gap-3 items-center">
                                                    <div className="flex-1">
                                                        <p className="ml-2">Loại từ</p>
                                                        <input
                                                            type="text"
                                                            placeholder="Loại từ (N,V,Adj,...)"
                                                            value={editWord.type_of_word}
                                                            onChange={(e) => setEditWord({ ...editWord, type_of_word: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="ml-2">Phiên âm</p>
                                                        <input
                                                            type="text"
                                                            placeholder="Phiên âm"
                                                            value={editWord.transcription}
                                                            onChange={(e) => setEditWord({ ...editWord, transcription: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="">
                                                    <p className="ml-2">Ví dụ</p>
                                                    <textarea
                                                        placeholder="Ví dụ (tối đa 10 câu)"
                                                        className="h-32"
                                                        value={editWord?.example?.map((ex) => `EN: ${ex.en}\nVI: ${ex.vi}`).join("\n\n")}
                                                        onChange={(e) => {
                                                            const updatedExamples = e.target.value.split("\n\n").map((sentence) => {
                                                                const [en, vi] = sentence.split("\n").map((line) => line.replace(/^EN: |^VI: /, "").trim());
                                                                return { en, vi };
                                                            });
                                                            setEditWord({ ...editWord, example: updatedExamples });
                                                        }}
                                                    />
                                                </div>
                                                <div className="">
                                                    <p className="ml-2">Ghi chú</p>
                                                    <textarea className="h-20" placeholder="Ghi chú" value={editWord.note} onChange={(e) => setEditWord({ ...editWord, note: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </Modal>
                                </div>
                                <p className="font-bold text-gray-600">({item?.type_of_word || "Không có loại từ"})</p>
                                <p className="font-bold text-gray-600">
                                    Định nghĩa: <span className="italic font-thin">{item?.define}</span>
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-gray-600">Ví dụ: </p>
                                    <p className="text-xs text-gray-600">{handleCompareDate(item?.created_at)}</p>
                                </div>

                                <div className=" border border-secondary rounded-lg px-5 py-3 my-3 h-[220px] overflow-y-auto">
                                    {item?.example?.map((ex, idx) => (
                                        <div key={ex.en} className="mb-1">
                                            <div className="">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-gray-600 font-bold">
                                                        {idx + 1}. {ex.en}
                                                    </p>
                                                    {flashcard?.language != "english" && (
                                                        <HiMiniSpeakerWave className="cursor-pointer hover:text-primary" onClick={() => speakWord(ex.en, 2, item?._id + idx)} />
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 flex">
                                                    {flashcard?.language == "english" && (
                                                        <>
                                                            <div className="flex items-center gap-1 mr-3 cursor-pointer hover:text-secondary" onClick={() => speakWord(ex.en, 1, item?._id + idx)}>
                                                                {loadingAudio == item?._id + idx ? (
                                                                    <Spin indicator={<LoadingOutlined spin />} size="small" style={{ color: "blue" }} />
                                                                ) : (
                                                                    <HiMiniSpeakerWave />
                                                                )}
                                                                <p>US</p>
                                                            </div>
                                                            <div className="flex items-center gap-1 cursor-pointer hover:text-secondary" onClick={() => speakWord(ex.en, 2, item?._id + idx)}>
                                                                {loadingAudio == item?._id + idx ? (
                                                                    <Spin indicator={<LoadingOutlined spin />} size="small" style={{ color: "blue" }} />
                                                                ) : (
                                                                    <HiMiniSpeakerWave />
                                                                )}
                                                                UK
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 italic">({ex.vi})</p>
                                        </div>
                                    ))}
                                </div>

                                <p className="font-bold text-gray-600">
                                    Ghi chú: <span className="italic font-thin">{item?.note}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {loading && <Spin indicator={<LoadingOutlined spin />} size="default" className="h-[400px] flex items-center justify-center" />}

                {isSimple === 2 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-5">
                        {flashcard?.flashcards?.map((item, index) => (
                            <div key={index} className="bg-gray-100 p-5 shadow-sm rounded-xl font-bold text-secondary space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-primary text-lg" title={item?.title}>
                                            {item?.title}
                                        </h1>
                                        <HiMiniSpeakerWave className="flex items-center gap-1 cursor-pointer" onClick={() => speakWord(item?.title, 2, item?._id)} />
                                    </div>
                                    <Popconfirm
                                        title={`Xóa từ "${item?.title}"`}
                                        description="Bạn có chắc muốn xóa từ này không?"
                                        okText="Chắc chắn"
                                        onConfirm={() => confirmDelete(item._id)}
                                        okButtonProps={{
                                            loading: loadingConfirm,
                                        }}
                                        cancelText="Để suy nghĩ lại"
                                        icon={
                                            <QuestionCircleOutlined
                                                style={{
                                                    color: "red",
                                                }}
                                            />
                                        }>
                                        <IoClose className="hover:text-red-500 cursor-pointer" />
                                    </Popconfirm>
                                </div>
                                <p>{item?.transcription}</p>
                                <div className="flex items-center gap-3">
                                    {flashcard?.language == "english" && (
                                        <>
                                            <div className="flex items-center gap-1 mr-2 cursor-pointer" onClick={() => speakWord(item?.title, 1, item?._id)}>
                                                {loadingAudio == item?._id ? <Spin indicator={<LoadingOutlined spin />} size="small" style={{ color: "blue" }} /> : <HiMiniSpeakerWave />}
                                                <p>US</p>
                                            </div>
                                            <div className="flex items-center gap-1 cursor-pointer" onClick={() => speakWord(item?.title, 2, item?._id)}>
                                                {loadingAudio == item?._id ? <Spin indicator={<LoadingOutlined spin />} size="small" style={{ color: "blue" }} /> : <HiMiniSpeakerWave />}
                                                UK
                                            </div>
                                        </>
                                    )}
                                </div>
                                <p className="font-bold text-gray-600">
                                    Định nghĩa: <span className="italic font-thin">{item?.define}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {flashcard?.flashcards?.length === 0 && <p className="h-[400px] flex items-center justify-center">Không có từ nào trong list</p>}
            </div>
        </div>
    );
}
