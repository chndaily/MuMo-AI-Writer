import TailwindAdvancedEditor from "@/components/novel/tiptapNovel/advanced-editor";
import { Button } from "antd";

const NovelManuscript = () => {
  return (
    <div className="overflow-auto">
      <div className="p-4">
        <TailwindAdvancedEditor />
      </div>
    </div>
  );
};

export default NovelManuscript;