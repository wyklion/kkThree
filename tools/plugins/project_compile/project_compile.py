#!/usr/bin/env python


import sys
import multiprocessing
import kkThree
import kk_project
import subprocess
import os
import re
import shutil
import platform
import json
import build_web
if sys.platform == 'win32':
    import _winreg

class KKPluginCompile(kkThree.KKPlugin):
    """
    compiles a project
    """

    BUILD_CONFIG_FILE = "build-cfg.json"
    OUTPUT_DIR_NATIVE = "bin"
    OUTPUT_DIR_SCRIPT_DEBUG = "runtime"
    OUTPUT_DIR_SCRIPT_RELEASE = "publish"

    ENGINE_JS_DIRS = [
        "frameworks/js-bindings/bindings/script",
        "cocos/scripting/js-bindings/script"
    ]

    @staticmethod
    def plugin_name():
      return "compile"

    @staticmethod
    def brief_description():
        return "Compiles the current project to binary"

    def _add_custom_options(self, parser):
        from argparse import ArgumentParser
        parser.add_argument("-m", "--mode", dest="mode", default='debug',
                          help="Set the compile mode, should be debug|release, default is debug.")
        parser.add_argument("-j", "--jobs", dest="jobs", type=int,
                          help="Allow N jobs at once.")
        parser.add_argument("-o", "--output-dir", dest="output_dir", help="Specify the output directory.")

        group = parser.add_argument_group("Web Options")
        group.add_argument("--source-map", dest="source_map", action="store_true", help='Enable source-map')
        group.add_argument("--advanced", dest="advanced", action="store_true", help="Compile all source js files using Closure Compiler's advanced mode, bigger compression ratio bug more risk")

        group = parser.add_argument_group("lua/js project arguments")
        group.add_argument("--no-res", dest="no_res", action="store_true", help="Package without project resources.")
        group.add_argument("--compile-script", dest="compile_script", type=int, choices=[0, 1], help="Diable/Enable the compiling of lua/js script files.")

        category = self.plugin_category()
        name = self.plugin_name()
        usage = "\n\t%%prog %s %s -p <platform> [-s src_dir][-m <debug|release>]" \
                "\nSample:" \
                "\n\t%%prog %s %s -p android" % (category, name, category, name)

    def _check_custom_options(self, args):
        if args.mode != 'release':
            args.mode = 'debug'

        self._mode = 'debug'
        if 'release' == args.mode:
            self._mode = args.mode

        if args.jobs is not None:
            self._jobs = args.jobs
        else:
            self._jobs = self.get_num_of_cpu()
        self._has_sourcemap = args.source_map
        self._web_advanced = args.advanced
        self._no_res = args.no_res

        if args.output_dir is None:
            self._output_dir = self._get_output_dir()
        else:
            if os.path.isabs(args.output_dir):
                self._output_dir = args.output_dir
            else:
                self._output_dir = os.path.abspath(args.output_dir)

        self.end_warning = ""
        self._gen_custom_step_args()

    def get_num_of_cpu(self):
        try:
            return multiprocessing.cpu_count()
        except Exception:
            print "Failed to detect number of cpus, assume 1 cpu"
            return 1

    def _get_output_dir(self):
        project_dir = self._project.get_project_dir()
        cur_platform = self._platforms.get_current_platform()
        if self._project._is_script_project():
            if self._mode == 'debug':
                output_dir = os.path.join(project_dir, KKPluginCompile.OUTPUT_DIR_SCRIPT_DEBUG, cur_platform)
            else:
                output_dir = os.path.join(project_dir, KKPluginCompile.OUTPUT_DIR_SCRIPT_RELEASE, cur_platform)
        else:
            output_dir = os.path.join(project_dir, KKPluginCompile.OUTPUT_DIR_NATIVE, self._mode, cur_platform)

        return output_dir

    def _gen_custom_step_args(self):
        self._custom_step_args = {
            "project-path": self._project.get_project_dir(),
            "platform-project-path": self._platforms.project_path(),
            "build-mode": self._mode,
            "output-dir": self._output_dir
        }

    def _build_cfg_path(self):
        cur_cfg = self._platforms.get_current_config()
        if self._platforms.is_win32_active():
            if cur_cfg.build_cfg_path is not None:
                project_dir = self._project.get_project_dir()
                ret = os.path.join(project_dir, cur_cfg.build_cfg_path)
            else:
                ret = self._platforms.project_path()
        elif self._platforms.is_ios_active():
            ret = os.path.join(self._platforms.project_path(), "ios")
        elif self._platforms.is_mac_active():
            ret = os.path.join(self._platforms.project_path(), "mac")
        else:
            ret = self._platforms.project_path()

        return ret

    def _update_build_cfg(self):
        build_cfg_dir = self._build_cfg_path()
        cfg_file_path = os.path.join(build_cfg_dir, KKPluginCompile.BUILD_CONFIG_FILE)
        if not os.path.isfile(cfg_file_path):
            return

        key_of_copy = None
        key_of_must_copy = None
        if self._platforms.is_android_active():
            from build_android import AndroidBuilder
            key_of_copy = AndroidBuilder.CFG_KEY_COPY_TO_ASSETS
            key_of_must_copy = AndroidBuilder.CFG_KEY_MUST_COPY_TO_ASSERTS
        elif self._platforms.is_win32_active():
            key_of_copy = CCPluginCompile.CFG_KEY_WIN32_COPY_FILES
            key_of_must_copy = CCPluginCompile.CFG_KEY_WIN32_MUST_COPY_FILES

        if key_of_copy is None and key_of_must_copy is None:
            return

        try:
            outfile = None
            open_file = open(cfg_file_path)
            cfg_info = json.load(open_file)
            open_file.close()
            open_file = None
            changed = False
            if key_of_copy is not None:
                if cfg_info.has_key(key_of_copy):
                    src_list = cfg_info[key_of_copy]
                    ret_list = self._convert_cfg_list(src_list, build_cfg_dir)
                    cfg_info[CCPluginCompile.CFG_KEY_COPY_RESOURCES] = ret_list
                    del cfg_info[key_of_copy]
                    changed = True

            if key_of_must_copy is not None:
                if cfg_info.has_key(key_of_must_copy):
                    src_list = cfg_info[key_of_must_copy]
                    ret_list = self._convert_cfg_list(src_list, build_cfg_dir)
                    cfg_info[CCPluginCompile.CFG_KEY_MUST_COPY_RESOURCES] = ret_list
                    del cfg_info[key_of_must_copy]
                    changed = True

            if changed:
                # backup the old-cfg
                split_list = os.path.splitext(KKPluginCompile.BUILD_CONFIG_FILE)
                file_name = split_list[0]
                ext_name = split_list[1]
                bak_name = file_name + "-for-v0.1" + ext_name
                bak_file_path = os.path.join(build_cfg_dir, bak_name)
                if os.path.exists(bak_file_path):
                    os.remove(bak_file_path)
                os.rename(cfg_file_path, bak_file_path)

                # write the new data to file
                with open(cfg_file_path, 'w') as outfile:
                    json.dump(cfg_info, outfile, sort_keys = True, indent = 4)
                    outfile.close()
                    outfile = None
        finally:
            if open_file is not None:
                open_file.close()

            if outfile is not None:
                outfile.close()

    def _is_debug_mode(self):
        return self._mode == 'debug'

    def build_web(self):
        if not self._platforms.is_web_active():
            return

        project_dir = self._platforms.project_path()

        # store env for run
        cfg_obj = self._platforms.get_current_config()
        if cfg_obj.run_root_dir is not None:
            self.run_root = cfg_obj.run_root_dir
        else:
            self.run_root = project_dir

        if cfg_obj.sub_url is not None:
            self.sub_url = cfg_obj.sub_url
        else:
            self.sub_url = '/'

        output_dir = "publish"
        if self._is_debug_mode():
            output_dir = "runtime"
            if not self._web_advanced:
                return

        self.sub_url = '%s%s/html5/' % (self.sub_url, output_dir)

        f = open(os.path.join(project_dir, "project.json"))
        project_json = json.load(f)
        f.close()
        engine_dir = os.path.join(project_json["engineDir"])
        realEngineDir = os.path.normpath(os.path.join(project_dir, engine_dir))
        publish_dir = os.path.normpath(os.path.join(project_dir, output_dir, "html5"))

        # need to config in options of command
        buildOpt = {
                "outputFileName" : "game.min.js",
                "debug": "true" if self._is_debug_mode() else "false",
                "compilationLevel" : "advanced" if self._web_advanced else "simple",
                "sourceMapOpened" : True if self._has_sourcemap else False
                }

        if os.path.exists(publish_dir) == False:
            os.makedirs(publish_dir)

        # generate build.xml
        build_web.gen_buildxml(project_dir, project_json, publish_dir, buildOpt)

        outputJsPath = os.path.join(publish_dir, buildOpt["outputFileName"])
        if os.path.exists(outputJsPath) == True:
            os.remove(outputJsPath)

        # call closure compiler
        ant_root = kkThree.check_environment_variable('ANT_ROOT')
        ant_path = os.path.join(ant_root, 'ant')
        self._run_cmd("%s -f %s" % (ant_path, os.path.join(publish_dir, 'build.xml')))

        # handle sourceMap
        sourceMapPath = os.path.join(publish_dir, "sourcemap")
        if os.path.exists(sourceMapPath):
            smFile = open(sourceMapPath)
            try:
                smContent = smFile.read()
            finally:
                smFile.close()

            dir_to_replace = project_dir
            if cocos.os_is_win32():
                dir_to_replace = project_dir.replace('\\', '\\\\')
            smContent = smContent.replace(dir_to_replace, os.path.relpath(project_dir, publish_dir))
            smContent = smContent.replace(realEngineDir, os.path.relpath(realEngineDir, publish_dir))
            smContent = smContent.replace('\\\\', '/')
            smContent = smContent.replace('\\', '/')
            smFile = open(sourceMapPath, "w")
            smFile.write(smContent)
            smFile.close()

        # handle project.json
        del project_json["engineDir"]
        del project_json["modules"]
        del project_json["jsList"]
        project_json_output_file = open(os.path.join(publish_dir, "project.json"), "w")
        project_json_output_file.write(json.dumps(project_json))
        project_json_output_file.close()

        # handle index.html
        indexHtmlFile = open(os.path.join(project_dir, "index.html"))
        try:
            indexContent = indexHtmlFile.read()
        finally:
            indexHtmlFile.close()
        reg1 = re.compile(r'<script\s+src\s*=\s*("|\')[^"\']*KKBoot\.js("|\')\s*><\/script>')
        indexContent = reg1.sub("", indexContent)
        mainJs = project_json.get("main") or "main.js"
        indexContent = indexContent.replace(mainJs, buildOpt["outputFileName"])
        indexHtmlOutputFile = open(os.path.join(publish_dir, "index.html"), "w")
        indexHtmlOutputFile.write(indexContent)
        indexHtmlOutputFile.close()
        
        # copy res dir
        dst_dir = os.path.join(publish_dir, 'res')
        src_dir = os.path.join(project_dir, 'res')
        if os.path.exists(dst_dir):
            shutil.rmtree(dst_dir)
        shutil.copytree(src_dir, dst_dir)

    def run(self, argv, dependencies):
        self.parse_args(argv)
        kkThree.Logging.info('Building mode: %s' % self._mode)
        self._update_build_cfg()

        target_platform = self._platforms.get_current_platform()
        args_build_copy = self._custom_step_args.copy()

        language = self._project.get_language()
        action_str = 'compile_%s' % language
        target_str = 'compile_for_%s' % target_platform

        # invoke the custom step: pre-build
        self._project.invoke_custom_step_script(kk_project.Project.CUSTOM_STEP_PRE_BUILD, target_platform, args_build_copy)

        self.build_web()

        # invoke the custom step: post-build
        self._project.invoke_custom_step_script(kk_project.Project.CUSTOM_STEP_POST_BUILD, target_platform, args_build_copy)

        if len(self.end_warning) > 0:
            kkThree.Logging.warning(self.end_warning)
