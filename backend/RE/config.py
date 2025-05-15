import json

class Config:
    def __init__(self, config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)

        self.load_path = config["load_path"]
        self.transformer_type = config["transformer_type"]
        self.model_name_or_path = config["model_name_or_path"]

        self.max_seq_length = config["max_seq_length"]
        self.test_batch_size = config["test_batch_size"]
        self.seed = config["seed"]
        self.num_class = config["num_class"]
        self.num_labels = config["num_labels"]
        self.n_gpu = 1
        self.device = "cpu"

    def __repr__(self):
        return "{}".format(self.__dict__.items())
