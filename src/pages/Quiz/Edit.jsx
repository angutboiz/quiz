import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Button, Form, Modal, Popover, Select, Input } from "antd";
import { addDoc, collection, doc, getDocs, getFirestore, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import { format, sub } from "date-fns";

export default function Edit() {
    const params = useParams();
    const [quiz, setQuiz] = useState();
    const [quest, setQuest] = useState([]);
    const [defaultValue, setDefaultValue] = useState("");

    const [user, setUser] = useState();
    const auth = getAuth();
    const db = getFirestore();
    const [form] = Form.useForm();

    const navigate = useNavigate();
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                Swal.fire({
                    title: "Bạn chưa đăng nhập",
                    text: "Vui lòng đăng nhập để tiếp tục",
                    icon: "warning",
                    didClose: () => {
                        navigate("/login");
                    },
                });
            }
        });
    }, []);

    useEffect(() => {
        const fetchQuiz = async () => {
            const querySnapshot = await getDocs(collection(db, "quiz"));
            const filteredQuiz = [];

            querySnapshot.forEach((doc) => {
                const data = doc;
                if (data.id === params.id) {
                    filteredQuiz.push({
                        id: doc.id,
                        data: doc.data(),
                    });
                }
            });

            setQuiz({
                title: filteredQuiz[0].data.title,
                content: filteredQuiz[0].data.content,
                image: filteredQuiz[0].data.img,
                subject: filteredQuiz[0].data.subject,
            });

            setQuest(filteredQuiz[0].data.questions);
            setDefaultValue(filteredQuiz[0].data.default);
        };

        fetchQuiz();
    }, [params.id, navigate]);

    console.log(quiz);

    useEffect(() => {
        if (quiz) {
            form.setFieldsValue(quiz);
        }
    }, [quiz, form]);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const onFinish = (values) => {
        const db = getFirestore();
        const updateData = async () => {
            const quizDocRef = doc(db, "quiz", params.id);

            try {
                await updateDoc(quizDocRef, {
                    title: values.title,
                    uid: user.uid,
                    subject: values.subject,
                    author: user.displayName,
                    email: user.email,
                    verify: user.emailVerified,
                    image_author: user.photoURL,
                    content: values.content,
                    img: values.image,
                    status: false,
                    questions: quest,
                    default: defaultValue,
                });
                Swal.fire({
                    icon: "success",
                    title: "Cập nhật thành công",
                    didClose: () => {
                        navigate("/");
                    },
                });
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Cập nhật không thành công",
                    text: "Mã lỗi\n" + error.code,
                });
            }
        };
        updateData();
    };

    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };

    const handleImage = (e) => {
        setQuiz({
            ...quiz,
            image: e.target.value,
        });
    };

    const handleTitle = (e) => {
        setQuiz({
            ...quiz,
            title: e.target.value,
        });
    };

    const handleContent = (e) => {
        setQuiz({
            ...quiz,
            content: e.target.value,
        });
    };

    const handleQuest = (e) => {
        const value = e.target.value.trim();
        const questArray = value.split("\n");
        const arr = [];
        setDefaultValue(value);
        for (let i = 0; i < questArray.length; i++) {
            if (questArray[i].trim().endsWith("?") || questArray[i].trim().endsWith(":")) {
                const question = questArray[i].trim();
                const answers = [
                    questArray[i + 1] ? questArray[i + 1].trim().replace("A. ", "") : "",
                    questArray[i + 2] ? questArray[i + 2].trim().replace("B. ", "") : "",
                    questArray[i + 3] ? questArray[i + 3].trim().replace("C. ", "") : "",
                    questArray[i + 4] ? questArray[i + 4].trim().replace("D. ", "") : "",
                ];
                const correct = questArray[i + 5] ? parseInt(questArray[i + 5].trim(), 10) - 1 : 0;

                arr.push({
                    id: i,
                    question,
                    answers,
                    correct,
                });

                i += 5;
            }
        }
        setQuest(arr);
    };

    const [open, setOpen] = useState(false);

    const hide = () => {
        setOpen(false);
    };

    const handleOpenChange = (newOpen) => {
        setOpen(newOpen);
    };

    return (
        <div className="flex items-center justify-center gap-5 flex-col md:flex-row">
            <div className="w-full h-[500px] md:h-auto md:w-[700px] bg-white p-2 md:p-5">
                <Form form={form} onFinish={onFinish} onFinishFailed={onFinishFailed} autoComplete="off" layout="vertical" className="frm-post my-3 overflow-y-scroll h-[600px]">
                    <h1 className="text-2xl font-bold text-green-500 text-center mb-5">Cập nhật bài quiz</h1>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Form.Item
                                label="Tiêu đề"
                                name="title"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập tiêu đề!",
                                    },
                                ]}>
                                <Input type="text" onChange={(e) => handleTitle(e)} name="title" id="title" placeholder="Nhập tiêu đề..." value={quiz?.title} />
                            </Form.Item>
                        </div>
                        <div className="flex-1">
                            <Form.Item
                                label="Nghành học - môn học"
                                name="subject"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng chọn nghành học - môn học!",
                                    },
                                ]}>
                                <Select
                                    className="w-full"
                                    showSearch
                                    placeholder="Tìm kiếm nghành học - môn học..."
                                    optionFilterProp="children"
                                    value={quiz?.subject}
                                    filterOption={(input, option) => (option?.label ?? "").includes(input)}
                                    filterSort={(optionA, optionB) => (optionA?.label ?? "").toLowerCase().localeCompare((optionB?.label ?? "").toLowerCase())}
                                    options={[
                                        {
                                            value: "cntt",
                                            label: "CNTT",
                                        },
                                        {
                                            value: "ketoan",
                                            label: "Kế toán",
                                        },
                                        {
                                            value: "dieuduong",
                                            label: "Điều dưỡng",
                                        },
                                        {
                                            value: "kythuat",
                                            label: "Kỹ thuật",
                                        },
                                        {
                                            value: "thucpham",
                                            label: "Thực phẩm",
                                        },
                                        {
                                            value: "taichinh",
                                            label: "Tài chính - ngân hàng",
                                        },
                                        {
                                            value: "qtkd",
                                            label: "Quản trị kinh doanh",
                                        },
                                        {
                                            value: "dulich",
                                            label: "Du lịch - lữ hành",
                                        },
                                        {
                                            value: "khachsan",
                                            label: "Quản trị khách sạn",
                                        },
                                        {
                                            value: "dongphuonghoc",
                                            label: "Đông phương học",
                                        },
                                        {
                                            value: "anh",
                                            label: "Ngôn ngữ anh",
                                        },
                                        {
                                            value: "trung",
                                            label: "Ngôn ngữ Trung",
                                        },
                                        {
                                            value: "tthcm",
                                            label: "Tư tưởng Hồ Chí Minh",
                                        },
                                        {
                                            value: "lsdang",
                                            label: "Lịch sử Đảng Cộng sản Việt Nam",
                                        },
                                        {
                                            value: "pldc",
                                            label: "Pháp luật đại cương	",
                                        },
                                        {
                                            value: "kttt",
                                            label: "Kinh tế chính trị Mác - Lênin",
                                        },
                                        {
                                            value: "cnxh",
                                            label: "Chủ nghĩa xã hội khoa học",
                                        },
                                        {
                                            value: "triet",
                                            label: "Triết học Mác - Lênin",
                                        },
                                    ]}
                                />
                                <div className=""></div>
                            </Form.Item>
                        </div>
                    </div>
                    <div className="mb-3">
                        <Form.Item
                            label="Nội dung"
                            name="content"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập nội dung",
                                },
                            ]}>
                            <Input type="text" onChange={(e) => handleContent(e)} name="content" id="content" placeholder="Nhập nội dung..." value={quiz?.content} />
                        </Form.Item>
                    </div>
                    <div className="mb-3">
                        <Form.Item
                            label="Đường dẫn hình ảnh"
                            name="image"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập đường dẫn hình ảnh",
                                },
                            ]}>
                            <div className="flex items-center">
                                <Input type="text" onChange={(e) => handleImage(e)} name="image" id="image" placeholder="Dán URL hình ảnh ở đây..." value={quiz?.image} />
                                <Popover
                                    content={<img width={400} src="./guide4.png" alt="" className="" />}
                                    title="Cách lấy đường đẫn hình ảnh (Image Address)"
                                    trigger="click"
                                    open={open}
                                    onOpenChange={handleOpenChange}>
                                    <Button className="text-gray-500 font-bold rounded-none mx-2">?</Button>
                                </Popover>
                            </div>
                        </Form.Item>
                    </div>
                    <div className="my-5">
                        <div className="mb-3">
                            <h1 className="text-2xl font-bold text-green-500 text-center mb-3">Cập nhật câu hỏi</h1>

                            <div className="block text-sm text-red-500">
                                <div className="flex items-center gap-2">
                                    <p>Click vào đây để xem</p>
                                    <Button className="bg-red-200 text-red-500 font-bold" onClick={showModal}>
                                        Lưu ý
                                    </Button>
                                    <Modal title="Các lưu ý trong quá trình thêm câu hỏi " open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                                        <p>
                                            - Phải có kí tự <label className="text-red-500 font-bold">"?" hoặc ":"</label> ở cuối câu hỏi
                                        </p>
                                        <p>
                                            - Các đáp án chỉ có <label className="text-red-500 font-bold">4</label>
                                        </p>
                                        <p>
                                            - Bấm phím <label className="text-red-500 font-bold">Enter</label> để xuống đáp án tiếp theo
                                        </p>
                                        <img src="./guide.png" alt="" className="mt-3 border-[5px] border-green-500 rounded-lg" />
                                        <img src="./guide3.png" alt="" className="mt-3 border-[5px] border-green-500 rounded-lg" />
                                    </Modal>
                                </div>
                                <p className="font-bold mt-3">Ví dụ:</p>
                                <textarea
                                    type="text"
                                    name="content"
                                    id="content"
                                    className="w-full p-2 border-[1px] border-gray-200 h-[400px] text-xl"
                                    placeholder=""
                                    onChange={(e) => handleQuest(e)}
                                    defaultValue={defaultValue}></textarea>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 text-right">
                        <button type="submit" className="bg-green-500 text-white ">
                            Cập nhật bài viết này
                        </button>
                    </div>
                </Form>
            </div>
            <div className="w-full md:w-[700px] md:h-[650px] bg-white p-5 overflow-y-auto frm-post">
                <h1 className="text-xl font-bold text-green-500 text-center">Preview</h1>
                <div className="flex items-center justify-center flex-col my-3">
                    <div className=" shadow-md border-2 rounded-lg overflow-hidden group w-[200px] ">
                        {quiz?.image ? <img src={quiz?.image} alt="" className="w-full h-[100px] object-cover" /> : ""}
                        <div className="p-3">
                            <h1 className="text-md text-green-500 font-bold line-clamp-1 h-[24px]">{quiz?.title}</h1>
                            <p className="text-gray-500 line-clamp-1 text-sm h-[20px]">{quiz?.content}</p>
                        </div>
                    </div>
                </div>
                <div className="">
                    {quest &&
                        quest.map((item, index) => {
                            return (
                                <div className="bg-white p-2 mt-2" key={index}>
                                    <h1 className="text-lg font-bold text-green-500 mb-3">
                                        Câu {index + 1}: {item.question}
                                    </h1>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {item.answers.map((answer, index) => (
                                            <div key={index} className={`border relative flex items-center ${item.correct === index ? "bg-green-100 text-green-500 font-bold" : ""}`}>
                                                <label className={`absolute h-full flex items-center justify-center font-bold p-3 ${item.correct === index ? "bg-green-500 text-white" : ""}`}>
                                                    {index === 0 ? "A" : index === 1 ? "B" : index === 2 ? "C" : "D"}
                                                </label>
                                                <input className="w-1 invisible" type="radio" id={item} name={item} checked={item.correct === index} />
                                                <label className="block w-full ml-7 p-3">{answer}</label>
                                            </div>
                                        ))}
                                        <p className="text-green-500 line-clamp-2 h-[48px]`">Đáp án đúng: {item.answers[item.correct]}</p>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
